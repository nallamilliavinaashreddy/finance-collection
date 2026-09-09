import { createClient } from '@/lib/supabase/client';
import { AdjustmentLedgerItem } from '@/types';
import { decodeLoanType, decodeInterestRate } from '@/lib/actions/loans';
import { recordInvestmentTransaction } from '@/lib/actions/investment';
import { recordInterestTransaction } from '@/lib/actions/interest';

export interface AdjustmentMetricsData {
  totalAdjustmentLoans: number;
  totalAdjustmentBalance: number;
  totalInterestEarned: number;
  totalPaymentsReceived: number;
}

export interface AdjustmentLoanBalances {
  originalPrincipal: number;
  principalOutstanding: number;
  accruedInterest: number;
  totalPayable: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPaymentsReceived: number;
  totalInterestAccrued: number;
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
 * Source of Truth Accounting Calculator for Adjustment Loans
 */
export async function getAdjustmentLoanBalances(
  loanId: string,
  supabaseClient?: any
): Promise<AdjustmentLoanBalances> {
  const supabase = supabaseClient || createClient();

  const { data: loan } = await supabase
    .from('loans')
    .select('amount_given, total_collection')
    .eq('id', loanId)
    .single();

  const originalPrincipal = Number(loan?.amount_given || loan?.total_collection || 0);

  const { data: ledger } = await supabase
    .from('adjustment_ledger')
    .select('transaction_type, interest_added, payment_received')
    .eq('loan_id', loanId);

  let totalInterestAccrued = 0;
  let totalPaymentsReceived = 0;

  (ledger || []).forEach((row: any) => {
    if (row.transaction_type === 'interest') {
      totalInterestAccrued += Number(row.interest_added || 0);
    } else if (row.transaction_type === 'payment') {
      totalPaymentsReceived += Number(row.payment_received || 0);
    }
  });

  const totalInterestPaid = Math.min(totalPaymentsReceived, totalInterestAccrued);
  const totalPrincipalPaid = Math.max(0, totalPaymentsReceived - totalInterestPaid);
  const accruedInterest = Math.max(0, totalInterestAccrued - totalInterestPaid);
  const principalOutstanding = Math.max(0, originalPrincipal - totalPrincipalPaid);
  const totalPayable = principalOutstanding + accruedInterest;

  return {
    originalPrincipal,
    principalOutstanding,
    accruedInterest,
    totalPayable,
    totalPrincipalPaid,
    totalInterestPaid,
    totalPaymentsReceived,
    totalInterestAccrued,
  };
}

/**
 * Auto Accrue Daily Interest on Current Outstanding Balance for Adjustment Loans
 * Formula: Daily Interest = (Principal * Monthly Rate / 100) / 30
 * Daily interest accrual MUST NOT increase Outstanding Principal Balance!
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

      // Fetch existing interest dates
      const { data: ledgerRows } = await supabase
        .from('adjustment_ledger')
        .select('transaction_date, transaction_type')
        .eq('loan_id', loan.id)
        .order('transaction_date', { ascending: true });

      const existingInterestDates = new Set<string>();
      (ledgerRows || []).forEach((row: any) => {
        if (row.transaction_type === 'interest') {
          existingInterestDates.add(row.transaction_date);
        }
      });

      const balances = await getAdjustmentLoanBalances(loan.id, supabase);

      // Sync loans table in Supabase so balance_amount matches Principal Outstanding
      if (Number(loan.balance_amount) !== balances.principalOutstanding || Number(loan.collected_amount) !== balances.totalPrincipalPaid) {
        await supabase
          .from('loans')
          .update({
            balance_amount: balances.principalOutstanding,
            collected_amount: balances.totalPrincipalPaid,
          })
          .eq('id', loan.id);
      }

      const monthlyInterestAmt = balances.originalPrincipal * (monthlyRate / 100);
      const dailyInterestAmt = Math.round((monthlyInterestAmt / 30) * 100) / 100;

      const startDateStr = loan.start_date || todayStr;
      let currDateStr = startDateStr;

      while (currDateStr <= todayStr) {
        if (!existingInterestDates.has(currDateStr)) {
          if (dailyInterestAmt > 0) {
            const payload = {
              loan_id: loan.id,
              transaction_date: currDateStr,
              transaction_type: 'interest',
              opening_balance: balances.principalOutstanding,
              interest_rate: monthlyRate,
              interest_added: dailyInterestAmt,
              payment_received: 0,
              closing_balance: balances.principalOutstanding, // Principal Outstanding is UNCHANGED by daily interest!
              remarks: `Simple Interest @ ₹${dailyInterestAmt}/day (₹${balances.originalPrincipal} × ${monthlyRate}% / 30)`,
            };

            const { error: insErr } = await supabase.from('adjustment_ledger').insert([payload]);
            if (!insErr) {
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
 * Accurately tracks principal outstanding, accrued interest, and total payable per item
 */
export async function getAdjustmentLedger(
  loanId: string
): Promise<{ success: boolean; data: AdjustmentLedgerItem[]; error?: string }> {
  const supabase = createClient();

  try {
    await autoAccrueAdjustmentInterest(loanId);

    const { data, error } = await supabase
      .from('adjustment_ledger')
      .select('*')
      .eq('loan_id', loanId)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    const balances = await getAdjustmentLoanBalances(loanId, supabase);
    const principal = balances.originalPrincipal;

    let cumulativePayments = 0;
    const formatted: AdjustmentLedgerItem[] = (data || []).map((item: any) => {
      const type = (item.transaction_type as any) || 'payment';
      const interestAdded = Number(item.interest_added || 0);
      const paymentReceived = Number(item.payment_received || 0);

      let opening = 0;
      let closing = 0;

      if (type === 'disbursement') {
        opening = 0;
        closing = principal;
      } else if (type === 'interest') {
        // Daily interest accrual leaves Principal Outstanding untouched!
        const currentPrincipalBal = Math.max(0, principal - cumulativePayments);
        opening = currentPrincipalBal;
        closing = currentPrincipalBal;
      } else if (type === 'payment') {
        const openingPrincipalBal = Math.max(0, principal - cumulativePayments);
        cumulativePayments += paymentReceived;
        const closingPrincipalBal = Math.max(0, principal - cumulativePayments);
        opening = openingPrincipalBal;
        closing = closingPrincipalBal;
      } else {
        opening = Number(item.opening_balance || 0);
        closing = Number(item.closing_balance || 0);
      }

      return {
        id: item.id || `ledger-${Math.random()}`,
        loanId: item.loan_id,
        transactionDate: item.transaction_date,
        transactionType: type,
        openingBalance: opening,
        interestRate: Number(item.monthly_interest_rate ?? item.interest_rate ?? 0),
        interestAdded: interestAdded,
        paymentReceived: paymentReceived,
        closingBalance: closing,
        remarks: item.remarks || undefined,
        createdAt: item.created_at || new Date().toISOString(),
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getAdjustmentLedger:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Calculate and Add Simple Daily Interest
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

    const balances = await getAdjustmentLoanBalances(loanId, supabase);
    const monthlyRate = decodeInterestRate(loan.working_days, loan.monthly_interest_rate || loan.interest_rate);

    if (monthlyRate <= 0) {
      return { success: false, error: 'Invalid interest rate. Interest rate must be greater than 0%.' };
    }

    const monthlyInterestAmount = balances.originalPrincipal * (monthlyRate / 100);
    const dailyRateAmount = Math.round((monthlyInterestAmount / 30) * 100) / 100;
    const dailyInterestAdded = Math.round((dailyRateAmount * daysCount) * 100) / 100;

    const openingBalance = balances.principalOutstanding;
    const closingBalance = balances.principalOutstanding;

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

    if (!insertErr && inserted) {
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
 * 3. Record Payment for Adjustment Loan & Allocate Payment to Accrued Interest then Outstanding Principal
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
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .eq('id', loanId)
      .single();

    if (loanErr || !loan) {
      return { success: false, error: 'Target loan not found.' };
    }

    if (amountPaid <= 0) {
      return { success: false, error: 'Payment amount must be greater than ₹0.' };
    }

    const prevBalances = await getAdjustmentLoanBalances(loanId, supabase);

    if (amountPaid > prevBalances.totalPayable && prevBalances.totalPayable > 0) {
      return {
        success: false,
        error: `Payment amount (${amountPaid}) cannot exceed total payable amount (${prevBalances.totalPayable}).`,
      };
    }

    // Payment Allocation: Satisfy Accrued Interest first, remainder reduces Principal
    const interestPaidThisPayment = Math.min(amountPaid, prevBalances.accruedInterest);
    const principalPaidThisPayment = amountPaid - interestPaidThisPayment;

    const newTotalPrincipalPaid = prevBalances.totalPrincipalPaid + principalPaidThisPayment;
    const newPrincipalOutstanding = Math.max(0, prevBalances.originalPrincipal - newTotalPrincipalPaid);
    const newAccruedInterest = Math.max(0, prevBalances.accruedInterest - interestPaidThisPayment);
    const isClosedNow = newPrincipalOutstanding <= 0 && newAccruedInterest <= 0;

    // PRIMARY UPDATE: Update loan principal balance & status in loans table
    const { error: updateErr } = await supabase
      .from('loans')
      .update({
        collected_amount: newTotalPrincipalPaid,
        balance_amount: newPrincipalOutstanding,
        is_closed: isClosedNow,
        status: isClosedNow ? 'closed' : 'active',
      })
      .eq('id', loanId);

    if (updateErr) {
      console.error('Error updating loan balance for payment:', updateErr);
      return { success: false, error: updateErr.message };
    }

    const rawRate = Number(loan.monthly_interest_rate ?? loan.interest_rate ?? 0);
    const splitRemark = remarks?.trim() || `Payment Received (Interest: ₹${interestPaidThisPayment}, Principal: ₹${principalPaidThisPayment})`;

    // SECONDARY INSERT: Insert payment record into adjustment_ledger table
    const payload = {
      loan_id: loanId,
      transaction_date: paymentDate,
      transaction_type: 'payment',
      opening_balance: prevBalances.principalOutstanding,
      interest_rate: rawRate,
      interest_added: 0,
      payment_received: amountPaid,
      closing_balance: newPrincipalOutstanding,
      remarks: splitRemark,
    };

    let insertedId = `adj-pay-${Date.now()}`;
    let insertedCreatedAt = new Date().toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('adjustment_ledger')
      .insert([payload])
      .select('*')
      .single();

    if (!insertErr && inserted) {
      insertedId = inserted.id;
      insertedCreatedAt = inserted.created_at;
    }

    // Insert into collections table so payment is registered across Collections stream, Day Book, etc.
    let collectionId = insertedId;
    try {
      const { data: collData } = await supabase.from('collections').insert([
        {
          loan_id: loanId,
          amount_paid: amountPaid,
          payment_date: paymentDate,
          remarks: splitRemark,
          remaining_balance_after_payment: newPrincipalOutstanding,
        },
      ]).select('id').single();
      if (collData?.id) collectionId = collData.id;
    } catch (collErr) {
      console.warn('Collection insert notice from adjustment payment:', collErr);
    }

    // If interest was paid in this payment, record in Interest Module
    if (interestPaidThisPayment > 0) {
      try {
        await recordInterestTransaction({
          collectionId,
          loanId,
          customerId: loan.customer_id,
          transactionDate: paymentDate,
          interestType: 'adjustment',
          interestAmount: interestPaidThisPayment,
          remarks: `Adjustment Interest Paid: ${loan.customers?.customer_name || 'Customer'}`,
        });
      } catch (intErr) {
        console.warn('Notice: Interest transaction record error:', intErr);
      }
    }

    const custName = loan.customers?.customer_name || 'Customer';
    const custId = loan.customers?.customer_id || 'ID';
    try {
      await recordInvestmentTransaction(
        'Collection Received',
        amountPaid,
        0,
        'collection',
        insertedId,
        `Adjustment Collection Received from ${custName} (${custId})`,
        paymentDate
      );
    } catch (invErr) {
      console.warn('Investment Khata notice from adjustment payment:', invErr);
    }

    const item: AdjustmentLedgerItem = {
      id: insertedId,
      loanId,
      transactionDate: paymentDate,
      transactionType: 'payment',
      openingBalance: prevBalances.principalOutstanding,
      interestRate: rawRate,
      interestAdded: 0,
      paymentReceived: amountPaid,
      closingBalance: newPrincipalOutstanding,
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
    let totalAdjustmentBalance = 0;

    for (const l of adjLoans) {
      if (!l.is_closed) {
        const b = await getAdjustmentLoanBalances(l.id, supabase);
        totalAdjustmentBalance += b.principalOutstanding;
      }
    }

    let totalInterestEarned = 0;
    let totalPaymentsReceived = 0;

    const { data: ledgerData } = await supabase.from('adjustment_ledger').select('*');

    if (ledgerData) {
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
