import { createClient } from '@/lib/supabase/client';
import { AdjustmentLedgerItem } from '@/types';
import { decodeLoanType, decodeInterestRate } from '@/lib/actions/loans';

export interface AdjustmentMetricsData {
  totalAdjustmentLoans: number;
  totalAdjustmentBalance: number;
  totalInterestEarned: number;
  totalPaymentsReceived: number;
}

/**
 * Helper to safely increment a YYYY-MM-DD date string by N days in UTC without timezone drift
 */
function addDaysToDateStr(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

/**
 * Auto Accrue Daily Interest on Current Outstanding Balance for Adjustment Loans
 * Runs automatically per day up to today's date
 * Catches up all missing days from loan start_date (or last interest date) to today
 * Formula: Daily Interest = (Current Outstanding Balance * Monthly Rate / 100) / 30
 * Prevents duplicate accruals on the same date for the same loan
 */
export async function autoAccrueAdjustmentInterest(targetLoanId?: string): Promise<{ success: boolean; accruedCount: number }> {
  const supabase = createClient();
  let accruedCount = 0;

  try {
    let query = supabase.from('loans').select('*').eq('is_closed', false);
    if (targetLoanId) {
      query = query.eq('id', targetLoanId);
    }
    const { data: loans, error: loansErr } = await query;
    if (loansErr || !loans || loans.length === 0) {
      return { success: true, accruedCount: 0 };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (const loan of loans) {
      const resolvedType = decodeLoanType(loan.working_days, loan.loan_type);
      if (resolvedType !== 'adjustment') continue;

      const monthlyRate = decodeInterestRate(loan.working_days, loan.monthly_interest_rate || loan.interest_rate);

      // Fetch all existing ledger records for this loan
      const { data: ledgerRows } = await supabase
        .from('adjustment_ledger')
        .select('transaction_date, transaction_type, closing_balance')
        .eq('loan_id', loan.id)
        .order('transaction_date', { ascending: true });

      const existingInterestDates = new Set<string>();
      let lastRecordedBalance = Number(loan.amount_given || loan.total_collection || 0);

      (ledgerRows || []).forEach((row: any) => {
        if (row.transaction_type === 'interest') {
          existingInterestDates.add(row.transaction_date);
        }
        if (row.closing_balance !== undefined && row.closing_balance !== null) {
          lastRecordedBalance = Number(row.closing_balance);
        }
      });

      const startDateStr = loan.start_date || todayStr;
      let currDateStr = startDateStr;
      let currentBalance = (ledgerRows && ledgerRows.length > 0)
        ? lastRecordedBalance
        : (loan.balance_amount !== undefined && loan.balance_amount !== null
            ? Number(loan.balance_amount)
            : Number(loan.total_collection || loan.amount_given || 0));

      const principal = Number(loan.amount_given || loan.total_collection || 0);
      const monthlyInterestAmt = principal * (monthlyRate / 100);
      const dailyInterestAmt = Math.round((monthlyInterestAmt / 30) * 100) / 100;

      while (currDateStr <= todayStr) {
        if (!existingInterestDates.has(currDateStr)) {
          if (dailyInterestAmt > 0) {
            const openingBalance = currentBalance;
            const closingBalance = Math.round((openingBalance + dailyInterestAmt) * 100) / 100;
            currentBalance = closingBalance;

            const payload = {
              loan_id: loan.id,
              transaction_date: currDateStr,
              transaction_type: 'interest',
              opening_balance: openingBalance,
              interest_rate: monthlyRate,
              interest_added: dailyInterestAmt,
              payment_received: 0,
              closing_balance: closingBalance,
              remarks: `Simple Interest @ ₹${dailyInterestAmt}/day (₹${principal} × ${monthlyRate}% / 30)`,
            };

            const { error: insErr } = await supabase.from('adjustment_ledger').insert([payload]);
            if (!insErr) {
              await supabase.from('loans').update({ balance_amount: closingBalance }).eq('id', loan.id);
              existingInterestDates.add(currDateStr);
              accruedCount++;
            } else {
              console.error('Failed to insert adjustment_ledger row:', insErr);
            }
          }
        }

        currDateStr = addDaysToDateStr(currDateStr, 1);
      }
    }

    return { success: true, accruedCount };
  } catch (err) {
    console.warn('Auto daily interest accrual notice:', err);
    return { success: false, accruedCount: 0 };
  }
}

/**
 * 1. Get chronological ledger history for a specific Adjustment Loan
 * Automatically triggers daily interest auto-accrual up to today before fetching
 */
export async function getAdjustmentLedger(
  loanId: string
): Promise<{ success: boolean; data: AdjustmentLedgerItem[]; error?: string }> {
  const supabase = createClient();

  try {
    // Run auto accrual check first
    await autoAccrueAdjustmentInterest(loanId);
    const { data, error } = await supabase
      .from('adjustment_ledger')
      .select('*')
      .eq('loan_id', loanId)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      // If table is missing from schema cache (PGRST205 or PGRST204 or 404), return empty array gracefully
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: adjustment_ledger table missing in schema cache, returning empty ledger history.');
        return { success: true, data: [] };
      }
      console.error('Supabase getAdjustmentLedger error:', error);
      return { success: false, data: [], error: error.message };
    }

    const formatted: AdjustmentLedgerItem[] = (data || []).map((item: any) => ({
      id: item.id || `ledger-${Math.random()}`,
      loanId: item.loan_id,
      transactionDate: item.transaction_date,
      transactionType: (item.transaction_type as any) || 'payment',
      openingBalance: Number(item.opening_balance || 0),
      interestRate: Number(item.monthly_interest_rate ?? item.interest_rate ?? 0),
      interestAdded: Number(item.interest_added || 0),
      paymentReceived: Number(item.payment_received || 0),
      closingBalance: Number(item.closing_balance || 0),
      remarks: item.remarks || undefined,
      createdAt: item.created_at || new Date().toISOString(),
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getAdjustmentLedger:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Calculate and Add Simple Daily Interest on Current Outstanding Balance
 * Updates loans table balance in Supabase and inserts into adjustment_ledger (handling missing table gracefully)
 */
export async function addDailyInterest(
  loanId: string,
  interestDate: string,
  daysCount: number = 1,
  remarks?: string
): Promise<{ success: boolean; data?: AdjustmentLedgerItem; error?: string }> {
  const supabase = createClient();

  try {
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanErr || !loan) {
      return { success: false, error: 'Target loan not found.' };
    }

    const openingBalance = loan.balance_amount !== undefined && loan.balance_amount !== null
      ? Number(loan.balance_amount)
      : Number(loan.total_collection || loan.amount_given || 0);

    const monthlyRate = decodeInterestRate(loan.working_days, loan.monthly_interest_rate || loan.interest_rate);

    if (monthlyRate <= 0) {
      return { success: false, error: 'Invalid interest rate. Interest rate must be greater than 0%.' };
    }

    // Simple Interest: Daily Interest is always calculated on the original Principal Amount (amount_given)
    const principal = Number(loan.amount_given || loan.total_collection || 0);
    const monthlyInterestAmount = principal * (monthlyRate / 100);
    const dailyRateAmount = Math.round((monthlyInterestAmount / 30) * 100) / 100;
    const dailyInterestAdded = Math.round((dailyRateAmount * daysCount) * 100) / 100;

    const closingBalance = openingBalance + dailyInterestAdded;

    // PRIMARY UPDATE: Update loan balance in loans table
    const { error: updateErr } = await supabase
      .from('loans')
      .update({ balance_amount: closingBalance, is_closed: false })
      .eq('id', loanId);

    if (updateErr) {
      console.error('Error updating loan balance for daily interest:', updateErr);
      return { success: false, error: updateErr.message };
    }

    // SECONDARY INSERT: Insert into adjustment_ledger table
    const payload = {
      loan_id: loanId,
      transaction_date: interestDate,
      transaction_type: 'interest',
      opening_balance: openingBalance,
      interest_rate: monthlyRate,
      interest_added: dailyInterestAdded,
      payment_received: 0,
      closing_balance: closingBalance,
      remarks:
        remarks?.trim() ||
        `Daily Interest (${daysCount} day${daysCount > 1 ? 's' : ''}) @ ₹${dailyRateAmount}/day (${monthlyRate}% / 30)`,
    };

    let insertedId = `adj-${Date.now()}`;
    let insertedCreatedAt = new Date().toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('adjustment_ledger')
      .insert([payload])
      .select('*')
      .single();

    if (insertErr) {
      if (insertErr.code === 'PGRST205' || insertErr.code === 'PGRST204' || insertErr.message?.includes('schema cache')) {
        console.warn('Notice: adjustment_ledger missing in schema cache. Loan balance updated successfully in Supabase.');
      } else {
        console.error('Error inserting daily interest into adjustment_ledger:', insertErr);
      }
    } else if (inserted) {
      insertedId = inserted.id;
      insertedCreatedAt = inserted.created_at;
    }

    const item: AdjustmentLedgerItem = {
      id: insertedId,
      loanId,
      transactionDate: interestDate,
      transactionType: 'interest',
      openingBalance,
      interestRate: monthlyRate,
      interestAdded: dailyInterestAdded,
      paymentReceived: 0,
      closingBalance,
      remarks: payload.remarks,
      createdAt: insertedCreatedAt,
    };

    return { success: true, data: item };
  } catch (err: any) {
    console.error('Unexpected error in addDailyInterest:', err);
    return { success: false, error: err?.message || 'Failed to add daily interest' };
  }
}

/**
 * 3. Record Payment for Adjustment Loan & Reduce Outstanding Balance Immediately
 * Updates loans table balance in Supabase and inserts into adjustment_ledger (handling missing table gracefully)
 */
export async function recordAdjustmentPayment(
  loanId: string,
  paymentDate: string,
  amountPaid: number,
  remarks?: string
): Promise<{ success: boolean; data?: AdjustmentLedgerItem; error?: string }> {
  const supabase = createClient();

  try {
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanErr || !loan) {
      return { success: false, error: 'Target loan not found.' };
    }

    const openingBalance = loan.balance_amount !== undefined && loan.balance_amount !== null
      ? Number(loan.balance_amount)
      : Number(loan.total_collection || loan.amount_given || 0);

    if (amountPaid <= 0) {
      return { success: false, error: 'Payment amount must be greater than ₹0.' };
    }

    if (amountPaid > openingBalance) {
      return {
        success: false,
        error: `Payment amount (${amountPaid}) cannot exceed current outstanding balance (${openingBalance}).`,
      };
    }

    const closingBalance = Math.max(0, openingBalance - amountPaid);
    const newCollected = Number(loan.collected_amount || 0) + amountPaid;
    const isClosedNow = closingBalance <= 0;

    // PRIMARY UPDATE: Update loan balance & status in loans table
    const { error: updateErr } = await supabase
      .from('loans')
      .update({
        collected_amount: newCollected,
        balance_amount: closingBalance,
        is_closed: isClosedNow,
      })
      .eq('id', loanId);

    if (updateErr) {
      console.error('Error updating loan balance for payment:', updateErr);
      return { success: false, error: updateErr.message };
    }

    const rawRate = Number(loan.monthly_interest_rate ?? loan.interest_rate ?? 0);

    // SECONDARY INSERT: Insert payment record into adjustment_ledger table
    const payload = {
      loan_id: loanId,
      transaction_date: paymentDate,
      transaction_type: 'payment',
      opening_balance: openingBalance,
      interest_rate: rawRate,
      interest_added: 0,
      payment_received: amountPaid,
      closing_balance: closingBalance,
      remarks: remarks?.trim() || 'Adjustment Payment Received',
    };

    let insertedId = `adj-pay-${Date.now()}`;
    let insertedCreatedAt = new Date().toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('adjustment_ledger')
      .insert([payload])
      .select('*')
      .single();

    if (insertErr) {
      if (insertErr.code === 'PGRST205' || insertErr.code === 'PGRST204' || insertErr.message?.includes('schema cache')) {
        console.warn('Notice: adjustment_ledger missing in schema cache. Loan payment updated successfully in Supabase.');
      } else {
        console.error('Error inserting payment into adjustment_ledger:', insertErr);
      }
    } else if (inserted) {
      insertedId = inserted.id;
      insertedCreatedAt = inserted.created_at;
    }

    const item: AdjustmentLedgerItem = {
      id: insertedId,
      loanId,
      transactionDate: paymentDate,
      transactionType: 'payment',
      openingBalance,
      interestRate: rawRate,
      interestAdded: 0,
      paymentReceived: amountPaid,
      closingBalance,
      remarks: payload.remarks,
      createdAt: insertedCreatedAt,
    };

    return { success: true, data: item };
  } catch (err: any) {
    console.error('Unexpected error in recordAdjustmentPayment:', err);
    return { success: false, error: err?.message || 'Failed to record payment' };
  }
}

/**
 * 4. Get Dashboard Metrics specifically for Adjustment Loans
 * Gracefully handles missing adjustment_ledger table
 */
export async function getAdjustmentMetrics(): Promise<{
  success: boolean;
  data: AdjustmentMetricsData;
  error?: string;
}> {
  const supabase = createClient();

  try {
    await autoAccrueAdjustmentInterest();
    const { data: loansData } = await supabase.from('loans').select('*');

    const adjLoans = (loansData || []).filter(
      (l: any) => l.loan_type === 'adjustment' || Number(l.working_days || 0) >= 9000
    );

    const totalAdjustmentLoans = adjLoans.length;
    const totalAdjustmentBalance = adjLoans.reduce(
      (sum: number, l: any) => sum + (l.is_closed ? 0 : Number(l.balance_amount || 0)),
      0
    );

    let totalInterestEarned = 0;
    let totalPaymentsReceived = 0;

    const { data: ledgerData, error: ledgerErr } = await supabase.from('adjustment_ledger').select('*');

    if (!ledgerErr && ledgerData) {
      totalInterestEarned = ledgerData
        .filter((r: any) => r.transaction_type === 'interest')
        .reduce((sum: number, r: any) => sum + Number(r.interest_added || 0), 0);

      totalPaymentsReceived = ledgerData
        .filter((r: any) => r.transaction_type === 'payment')
        .reduce((sum: number, r: any) => sum + Number(r.payment_received || 0), 0);
    }

    return {
      success: true,
      data: {
        totalAdjustmentLoans,
        totalAdjustmentBalance,
        totalInterestEarned,
        totalPaymentsReceived,
      },
    };
  } catch (err: any) {
    console.error('Error fetching adjustment metrics:', err);
    return {
      success: true,
      data: {
        totalAdjustmentLoans: 0,
        totalAdjustmentBalance: 0,
        totalInterestEarned: 0,
        totalPaymentsReceived: 0,
      },
    };
  }
}
