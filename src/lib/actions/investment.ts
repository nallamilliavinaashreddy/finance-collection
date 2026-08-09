import { createClient } from '@/lib/supabase/client';
import { InvestmentTransaction, InvestmentMetrics, InvestmentTransactionType } from '@/types';
import { AddCapitalFormData, BusinessWithdrawalFormData, WithdrawalReturnFormData, InvestmentSettingsFormData } from '@/lib/validations/investment';

/**
 * Safely format and log PostgrestError properties (message, code, details, hint)
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Unknown database error';
  if (typeof error === 'string') return error;

  const message = error.message || 'Database error occurred';
  const code = error.code ? ` [Code: ${error.code}]` : '';
  const details = error.details ? ` Details: ${error.details}` : '';
  const hint = error.hint ? ` Hint: ${error.hint}` : '';

  console.error('Supabase Error Details:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  return `${message}${code}${details}${hint}`.trim();
}

/**
 * Safely parse PostgREST missing table errors (PGRST205 / 404 / 42P01)
 */
function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

/**
 * 1. Get Global Monthly Interest Rate Setting
 */
export async function getInvestmentSettings(): Promise<{ monthlyInterestRate: number }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('investment_settings').select('*').limit(1);

    if (error || !data || data.length === 0) {
      return { monthlyInterestRate: 5.00 }; // Default 5% per month
    }
    return { monthlyInterestRate: Number(data[0].monthly_interest_rate || 5.00) };
  } catch (err) {
    return { monthlyInterestRate: 5.00 };
  }
}

/**
 * 2. Update Global Monthly Interest Rate Setting
 */
export async function updateInvestmentSettings(
  formData: InvestmentSettingsFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data } = await supabase.from('investment_settings').select('id').limit(1);

    let error: any = null;
    if (data && data.length > 0) {
      const res = await supabase
        .from('investment_settings')
        .update({
          monthly_interest_rate: formData.monthlyInterestRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data[0].id);
      error = res.error;
    } else {
      const res = await supabase.from('investment_settings').insert([
        {
          monthly_interest_rate: formData.monthlyInterestRate,
        },
      ]);
      error = res.error;
    }

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: false, error: 'investment_settings table does not exist in Supabase SQL editor yet.' };
      }
      return { success: false, error: formatSupabaseError(error) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * Get current running investment cash balance (Working Capital)
 */
export async function getCurrentInvestmentBalance(): Promise<number> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select('balance')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 0;
    }

    return Number(data[0].balance || 0);
  } catch (err) {
    return 0;
  }
}

/**
 * Universal automated helper to record an investment transaction entry.
 * Note: Daily interest accrual is recorded as daily_interest_added,
 * but DOES NOT increase cash balance/working capital.
 * Closing Balance = Opening Balance + Amount In - Amount Out
 */
export async function recordInvestmentTransaction(
  transactionType: InvestmentTransactionType,
  amountIn: number,
  amountOut: number,
  referenceType?: string,
  referenceId?: string,
  remarks?: string,
  transactionDate?: string,
  dailyInterestOverride?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const openingBalance = await getCurrentInvestmentBalance();
    const { monthlyInterestRate } = await getInvestmentSettings();

    const dailyInterestAdded = dailyInterestOverride !== undefined
      ? Number(dailyInterestOverride)
      : 0;

    // Correct Accounting:
    // Closing Balance (Cash/Working Capital) = Opening Balance + Amount In - Amount Out
    // Daily interest accrued is recorded in daily_interest_added, but does NOT change cash balance!
    const closingBalance = openingBalance + Number(amountIn || 0) - Number(amountOut || 0);

    const payload = {
      transaction_date: transactionDate || new Date().toISOString().split('T')[0],
      transaction_type: transactionType,
      opening_balance: Math.round(openingBalance * 100) / 100,
      amount_in: Number(amountIn || 0),
      amount_out: Number(amountOut || 0),
      interest_rate: monthlyInterestRate,
      daily_interest_added: Math.round(dailyInterestAdded * 100) / 100,
      balance: Math.round(closingBalance * 100) / 100,
      reference_type: referenceType || null,
      reference_id: referenceId ? String(referenceId) : null,
      remarks: remarks || null,
    };

    const { error } = await supabase.from('investment_transactions').insert([payload]);

    if (error) {
      if (isTableNotFoundError(error)) {
        return {
          success: false,
          error: 'The investment_transactions table does not exist in Supabase. Please execute the SQL migration script in Supabase SQL Editor.',
        };
      }
      return { success: false, error: formatSupabaseError(error) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * Auto-Accrue Missing Daily Interest from the last accrued date through today.
 * Prevents duplicate accruals on dates that already have a 'Daily Interest' entry.
 */
export async function autoAccrueDailyInvestmentInterest(): Promise<{ success: boolean; accruedDays?: number }> {
  const supabase = createClient();
  try {
    const { monthlyInterestRate } = await getInvestmentSettings();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch existing Daily Interest dates to avoid duplicate accruals
    const { data: existingIntTx } = await supabase
      .from('investment_transactions')
      .select('transaction_date')
      .eq('transaction_type', 'Daily Interest');

    const existingDates = new Set((existingIntTx || []).map((t: any) => t.transaction_date));

    // 2. If today is already accrued, check if any recent days were missed
    // Find earliest transaction date to start accrual timeline
    const { data: firstTx } = await supabase
      .from('investment_transactions')
      .select('transaction_date')
      .order('transaction_date', { ascending: true })
      .limit(1);

    if (!firstTx || firstTx.length === 0) {
      return { success: true, accruedDays: 0 };
    }

    const startDate = new Date(firstTx[0].transaction_date);
    const today = new Date();

    let curr = new Date(startDate);
    let countAccrued = 0;

    // Loop through calendar days up to today
    while (curr <= today) {
      const dateStr = curr.toISOString().split('T')[0];

      if (!existingDates.has(dateStr)) {
        const currentBalance = await getCurrentInvestmentBalance();
        if (currentBalance > 0) {
          const dailyInterest = (currentBalance * monthlyInterestRate) / 100 / 30;
          const roundedInterest = Math.round(dailyInterest * 100) / 100;

          if (roundedInterest > 0) {
            const remarks = `Daily Simple Interest @ ${monthlyInterestRate}%/month on Balance ₹${currentBalance.toLocaleString('en-IN')}`;

            await recordInvestmentTransaction(
              'Daily Interest',
              0,
              0,
              'interest',
              undefined,
              remarks,
              dateStr,
              roundedInterest
            );
            existingDates.add(dateStr);
            countAccrued++;
          }
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    return { success: true, accruedDays: countAccrued };
  } catch (err: any) {
    console.warn('Auto accrual notice:', err);
    return { success: false, accruedDays: 0 };
  }
}

/**
 * 3. Add Daily Simple Interest on Current Investment Balance
 * Triggers auto-accrual for missing dates up to today.
 */
export async function addDailyInterest(
  daysCount: number = 1,
  customDate?: string
): Promise<{ success: boolean; interestAdded?: number; error?: string }> {
  try {
    const res = await autoAccrueDailyInvestmentInterest();

    const supabase = createClient();
    const { data: todayTx } = await supabase
      .from('investment_transactions')
      .select('daily_interest_added')
      .eq('transaction_type', 'Daily Interest');

    const totalInterestAccrued = (todayTx || []).reduce(
      (sum: number, t: any) => sum + Number(t.daily_interest_added || 0),
      0
    );

    return {
      success: true,
      interestAdded: Math.round(totalInterestAccrued * 100) / 100,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add daily interest' };
  }
}

/**
 * 4. Add Capital (Admin Investment)
 */
export async function addCapital(formData: AddCapitalFormData): Promise<{ success: boolean; error?: string }> {
  try {
    if (formData.monthlyInterestRate !== undefined) {
      await updateInvestmentSettings({ monthlyInterestRate: formData.monthlyInterestRate });
    }

    const remarks = `Capital Added via Source: ${formData.source}${formData.remarks ? ' | ' + formData.remarks : ''}`;
    const res = await recordInvestmentTransaction(
      'Capital Added',
      formData.amount,
      0,
      'capital',
      undefined,
      remarks,
      formData.transactionDate
    );

    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record capital addition' };
  }
}

/**
 * 5. Record Business Withdrawal
 */
export async function recordBusinessWithdrawal(
  formData: BusinessWithdrawalFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const withdrawalDate = formData.withdrawalDate || new Date().toISOString().split('T')[0];
    const remarks = `Business Withdrawal${formData.remarks ? ' | ' + formData.remarks : ''}`;

    const res = await recordInvestmentTransaction(
      'Business Withdrawal',
      0,
      formData.amount,
      'withdrawal',
      undefined,
      remarks,
      withdrawalDate
    );

    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record business withdrawal' };
  }
}

/**
 * 6. Record Withdrawal Return (Owner returning withdrawn capital into business)
 */
export async function recordWithdrawalReturn(
  formData: WithdrawalReturnFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const returnDate = formData.returnDate || new Date().toISOString().split('T')[0];
    const remarks = `Withdrawal Return (${formData.paymentMode})${formData.remarks ? ' | ' + formData.remarks : ''}`;

    const res = await recordInvestmentTransaction(
      'Withdrawal Return',
      formData.amount,
      0,
      'withdrawal_return',
      undefined,
      remarks,
      returnDate
    );

    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record withdrawal return' };
  }
}

/**
 * Chronologically recalculate opening and closing balances for all investment transactions
 * Accounting Rule: Closing Balance = Opening Balance + Amount In - Amount Out
 */
export async function recalculateInvestmentLedgerBalances(): Promise<void> {
  const supabase = createClient();
  try {
    const { data: rows, error } = await supabase
      .from('investment_transactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !rows || rows.length === 0) return;

    let runningBalance = 0;
    for (const row of rows) {
      const openingBal = runningBalance;
      const amtIn = Number(row.amount_in || 0);
      const amtOut = Number(row.amount_out || 0);
      // Correct Accounting: Daily Interest is recorded in daily_interest_added,
      // but DOES NOT inflate cash balance/working capital!
      const closingBal = Math.round((openingBal + amtIn - amtOut) * 100) / 100;

      if (Number(row.opening_balance) !== openingBal || Number(row.balance) !== closingBal) {
        await supabase
          .from('investment_transactions')
          .update({
            opening_balance: openingBal,
            balance: closingBal,
          })
          .eq('id', row.id);
      }
      runningBalance = closingBal;
    }
  } catch (err) {
    console.warn('Error recalculating investment ledger balances:', err);
  }
}

/**
 * Update an existing investment transaction by reference_type and reference_id,
 * and recalculate running ledger balances.
 */
export async function updateInvestmentTransactionByReference(
  referenceType: string,
  referenceId: string,
  amountIn: number,
  amountOut: number,
  remarks?: string,
  transactionDate?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data: existing } = await supabase
      .from('investment_transactions')
      .select('id')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .maybeSingle();

    if (existing) {
      const payload: any = {
        amount_in: Number(amountIn || 0),
        amount_out: Number(amountOut || 0),
      };
      if (remarks) payload.remarks = remarks;
      if (transactionDate) payload.transaction_date = transactionDate;

      const { error } = await supabase
        .from('investment_transactions')
        .update(payload)
        .eq('id', existing.id);

      if (error && !isTableNotFoundError(error)) {
        return { success: false, error: formatSupabaseError(error) };
      }

      await recalculateInvestmentLedgerBalances();
      return { success: true };
    } else {
      const mappedType = referenceType === 'stamp'
        ? 'Stamp Income'
        : (referenceType === 'chit_prize'
            ? 'Chit Prize Received'
            : (referenceType === 'chit_payment' ? 'Chit Installment' : 'Expense'));

      return await recordInvestmentTransaction(
        mappedType,
        amountIn,
        amountOut,
        referenceType,
        referenceId,
        remarks,
        transactionDate
      );
    }
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * Delete an investment transaction by reference_type and reference_id,
 * and recalculate running ledger balances.
 */
export async function deleteInvestmentTransactionByReference(
  referenceType: string,
  referenceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('investment_transactions')
      .delete()
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId);

    if (error && !isTableNotFoundError(error)) {
      console.warn(`Error deleting investment transaction for ${referenceType} ${referenceId}:`, error);
    }

    await recalculateInvestmentLedgerBalances();
    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * Auto-convert any legacy 'Stamp Expense' entries in investment_transactions to 'Stamp Income'
 */
export async function convertExistingStampExpensesToIncome(): Promise<void> {
  const supabase = createClient();
  try {
    const { data: expenses } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('transaction_type', 'Stamp Expense');

    if (!expenses || expenses.length === 0) return;

    for (const exp of expenses) {
      const stampAmount = Number(exp.amount_out || exp.amount_in || 0);
      await supabase
        .from('investment_transactions')
        .update({
          transaction_type: 'Stamp Income',
          amount_in: stampAmount,
          amount_out: 0,
          remarks: 'Stamp Income',
        })
        .eq('id', exp.id);
    }

    await recalculateInvestmentLedgerBalances();
  } catch (err) {
    console.warn('Notice: Error converting legacy Stamp Expenses to Income:', err);
  }
}

/**
 * 7. Get Investment Transactions (Ledger)
 */
export async function getInvestmentTransactions(
  searchQuery: string = '',
  transactionTypeFilter: string = 'all'
): Promise<{ success: boolean; data: InvestmentTransaction[]; error?: string }> {
  const supabase = createClient();

  try {
    await autoAccrueDailyInvestmentInterest();
    await convertExistingStampExpensesToIncome();
    await recalculateInvestmentLedgerBalances();

    let query = supabase.from('investment_transactions').select('*').order('created_at', { ascending: false });

    if (transactionTypeFilter && transactionTypeFilter !== 'all') {
      query = query.eq('transaction_type', transactionTypeFilter);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    let items: InvestmentTransaction[] = (data || []).map((row: any) => ({
      id: row.id,
      transactionDate: row.transaction_date,
      transactionType: row.transaction_type,
      openingBalance: Number(row.opening_balance || 0),
      amountIn: Number(row.amount_in || 0),
      amountOut: Number(row.amount_out || 0),
      interestRate: Number(row.interest_rate ?? row.monthly_interest_rate ?? 0),
      dailyInterestAdded: Number(row.daily_interest_added || 0),
      balance: Number(row.balance || 0),
      closingBalance: Number(row.balance || 0),
      referenceType: row.reference_type || undefined,
      referenceId: row.reference_id || undefined,
      remarks: row.remarks || undefined,
      createdAt: row.created_at,
    }));

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.transactionType.toLowerCase().includes(q) ||
          (item.remarks && item.remarks.toLowerCase().includes(q)) ||
          item.transactionDate.includes(q)
      );
    }

    return { success: true, data: items };
  } catch (err: any) {
    return { success: true, data: [] };
  }
}

/**
 * 8. Get Investment Metrics Summary
 */
export async function getInvestmentMetrics(): Promise<{ success: boolean; data: InvestmentMetrics; error?: string }> {
  const supabase = createClient();

  try {
    await autoAccrueDailyInvestmentInterest();
    await convertExistingStampExpensesToIncome();
    await recalculateInvestmentLedgerBalances();

    const { data: txData } = await supabase.from('investment_transactions').select('*');
    const { data: loansData } = await supabase.from('loans').select('amount_given, total_collection, total_collection_amount, is_closed');
    const { data: expensesData } = await supabase.from('expenses').select('amount');
    const { monthlyInterestRate } = await getInvestmentSettings();

    const transactions = txData || [];

    // 1. Current Balance / Working Capital (latest cash balance)
    let currentBalance = 0;
    if (transactions.length > 0) {
      const sorted = [...transactions].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      currentBalance = Number(sorted[0].balance || 0);
    }

    // 2. Accrued Investment Interest (Total interest calculated on owner's investment)
    const investmentInterest = transactions.reduce(
      (sum: number, t: any) => sum + Number(t.daily_interest_added || 0),
      0
    );

    // 3. Owner Capital (Sum of direct capital contributions + returns - withdrawals)
    const totalCapitalAdded = transactions
      .filter((t: any) => t.transaction_type === 'Capital Added')
      .reduce((sum: number, t: any) => sum + Number(t.amount_in || 0), 0);

    const totalCapitalReturned = transactions
      .filter((t: any) => t.transaction_type === 'Capital Returned')
      .reduce((sum: number, t: any) => sum + Number(t.amount_out || 0), 0);

    const totalWithdrawals = transactions
      .filter((t: any) => t.transaction_type === 'Business Withdrawal')
      .reduce((sum: number, t: any) => sum + Number(t.amount_out || 0), 0);

    const totalReturns = transactions
      .filter((t: any) => t.transaction_type === 'Withdrawal Return')
      .reduce((sum: number, t: any) => sum + Number(t.amount_in || 0), 0);

    const businessWithdrawals = Math.max(0, totalWithdrawals - totalReturns);
    const ownerCapital = Math.max(0, totalCapitalAdded + totalReturns - totalWithdrawals - totalCapitalReturned);

    // 4. Loan Interest (Total interest earned from active loans)
    const loans = loansData || [];
    const loanInterest = loans
      .filter((l: any) => !l.is_closed)
      .reduce((sum: number, l: any) => {
        const given = Number(l.amount_given || 0);
        const target = Number(l.total_collection || l.total_collection_amount || 0);
        return sum + Math.max(0, target - given);
      }, 0);

    // 5. Expenses (Total operational expenses)
    const expenses = (expensesData || []).reduce(
      (sum: number, e: any) => sum + Number(e.amount || 0),
      0
    );

    const totalWorkingCapital = currentBalance;

    // Net Profit / Loss = Loan Interest - Investment Interest - Expenses
    const netProfit = Math.round((loanInterest - investmentInterest - expenses) * 100) / 100;

    return {
      success: true,
      data: {
        ownerCapital: Math.round((ownerCapital || currentBalance) * 100) / 100,
        totalWorkingCapital: Math.round(totalWorkingCapital * 100) / 100,
        currentBalance: Math.round(currentBalance * 100) / 100,
        investmentInterest: Math.round(investmentInterest * 100) / 100,
        loanInterest: Math.round(loanInterest * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        businessWithdrawals: Math.round(businessWithdrawals * 100) / 100,
        netProfit,
        monthlyInterestRate,
      },
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        ownerCapital: 0,
        totalWorkingCapital: 0,
        currentBalance: 0,
        investmentInterest: 0,
        loanInterest: 0,
        expenses: 0,
        businessWithdrawals: 0,
        netProfit: 0,
        monthlyInterestRate: 5.0,
      },
    };
  }
}
