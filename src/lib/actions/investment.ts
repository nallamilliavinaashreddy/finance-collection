import { createClient } from '@/lib/supabase/client';
import { InvestmentTransaction, InvestmentMetrics, InvestmentTransactionType } from '@/types';
import { AddCapitalFormData, BusinessWithdrawalFormData, WithdrawalReturnFormData, InvestmentSettingsFormData } from '@/lib/validations/investment';
import { calculateYearlyBreakdown } from '@/lib/utils/yearly-interest-engine';

/**
 * Safely format and log PostgrestError properties
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
 * Safely parse PostgREST missing table errors
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
 * 1. Get Global Monthly Interest Rate Setting (Default: 6.00% / month = ₹600 for ₹10,000)
 */
export async function getInvestmentSettings(): Promise<{ monthlyInterestRate: number; annualInterestRate: number; interestType: 'simple' | 'compound' }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('investment_settings').select('*').limit(1);

    if (error || !data || data.length === 0) {
      return { monthlyInterestRate: 1.5, annualInterestRate: 18.0, interestType: 'simple' };
    }
    const row = data[0];
    const annualRate = Number(row.annual_interest_rate ?? (row.monthly_interest_rate ? row.monthly_interest_rate * 12 : 18.0));
    const interestType = row.interest_type === 'compound' ? 'compound' : 'simple';

    return { monthlyInterestRate: annualRate / 12, annualInterestRate: annualRate, interestType };
  } catch (err) {
    return { monthlyInterestRate: 1.5, annualInterestRate: 18.0, interestType: 'simple' };
  }
}

/**
 * 2. Update Global Monthly Interest Rate Setting
 */
export async function updateInvestmentSettings(
  formData: { annualInterestRate?: number; interestType?: 'simple' | 'compound' }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data } = await supabase.from('investment_settings').select('id').limit(1);

    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (formData.annualInterestRate !== undefined) {
      payload.annual_interest_rate = Number(formData.annualInterestRate);
      payload.monthly_interest_rate = Number(formData.annualInterestRate) / 12;
    }
    if (formData.interestType) {
      payload.interest_type = formData.interestType;
    }

    let error: any = null;
    if (data && data.length > 0) {
      const res = await supabase
        .from('investment_settings')
        .update(payload)
        .eq('id', data[0].id);
      error = res.error;
    } else {
      const res = await supabase.from('investment_settings').insert([
        {
          annual_interest_rate: formData.annualInterestRate || 18.0,
          monthly_interest_rate: (formData.annualInterestRate || 18.0) / 12,
          interest_type: formData.interestType || 'simple',
        },
      ]);
      error = res.error;
    }

    if (error) {
      // Handle PGRST204 (column missing in PostgreSQL schema cache) gracefully
      if (
        error.code === 'PGRST204' ||
        (error.message || '').includes('annual_interest_rate') ||
        (error.message || '').includes('interest_type')
      ) {
        const fallbackPayload: any = {
          monthly_interest_rate: formData.annualInterestRate !== undefined ? Number(formData.annualInterestRate) / 12 : 1.5,
          updated_at: new Date().toISOString(),
        };
        if (data && data.length > 0) {
          const fbRes = await supabase
            .from('investment_settings')
            .update(fallbackPayload)
            .eq('id', data[0].id);
          if (!fbRes.error) return { success: true };
        } else {
          const fbRes = await supabase.from('investment_settings').insert([fallbackPayload]);
          if (!fbRes.error) return { success: true };
        }
      }
      if (isTableNotFoundError(error)) {
        return { success: false, error: 'investment_settings table does not exist in Supabase.' };
      }
      return { success: false, error: formatSupabaseError(error) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

function parseUTCDateString(dateStr: any): number {
  if (!dateStr) return 0;
  const clean = String(dateStr).trim().split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return 0;
  return Date.UTC(yyyy, mm, dd);
}

/**
 * Get current running investment cash balance (Working Capital)
 */
export async function getCurrentInvestmentBalance(): Promise<number> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return 0;
    }

    let running = 0;
    const sorted = [...data].sort((a: any, b: any) => {
      const dateA = parseUTCDateString(a.transaction_date);
      const dateB = parseUTCDateString(b.transaction_date);
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    for (const tx of sorted) {
      const amtIn = Number(tx.amount_in || 0);
      const amtOut = Number(tx.amount_out || 0);
      running = Math.round((running + amtIn - amtOut) * 100) / 100;
    }

    return running;
  } catch (err) {
    return 0;
  }
}

/**
 * Universal helper to record an investment transaction entry.
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
    // Helper to get today's local date YYYY-MM-DD
    const getLocalTodayISO = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let validDate = transactionDate ? transactionDate.trim() : '';
    // Validate YYYY-MM-DD format (preserves authoritative user-selected historical dates)
    if (
      !validDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(validDate) ||
      isNaN(new Date(`${validDate}T00:00:00`).getTime())
    ) {
      validDate = getLocalTodayISO();
    }

    // Underlying Interest Uniqueness Check: Prevent duplicate interest records for the same date/year
    if (transactionType === 'Annual Interest' || transactionType === 'Daily Interest' || referenceType === 'yearly_interest' || referenceType === 'monthly_interest') {
      const yearKey = referenceId || validDate.substring(0, 4);

      const { data: existingInterest } = await supabase
        .from('investment_transactions')
        .select('id')
        .or(`and(transaction_type.eq.Annual Interest,transaction_date.eq.${validDate}),and(reference_type.eq.yearly_interest,reference_id.eq.${yearKey})`);

      if (existingInterest && existingInterest.length > 0) {
        return { success: true };
      }
    }

    const openingBalance = await getCurrentInvestmentBalance();
    const { annualInterestRate } = await getInvestmentSettings();

    const dailyInterestAdded = dailyInterestOverride !== undefined
      ? Number(dailyInterestOverride)
      : 0;

    const closingBalance = Math.round((openingBalance + Number(amountIn || 0) - Number(amountOut || 0)) * 100) / 100;

    const payload = {
      transaction_date: validDate,
      transaction_type: transactionType,
      opening_balance: Math.round(openingBalance * 100) / 100,
      amount_in: Number(amountIn || 0),
      amount_out: Number(amountOut || 0),
      interest_rate: annualInterestRate,
      daily_interest_added: Math.round(dailyInterestAdded * 100) / 100,
      balance: closingBalance,
      reference_type: referenceType || null,
      reference_id: referenceId ? String(referenceId) : null,
      remarks: remarks || null,
    };

    const { error } = await supabase.from('investment_transactions').insert([payload]);

    if (error) {
      if (isTableNotFoundError(error)) {
        return {
          success: false,
          error: 'The investment_transactions table does not exist in Supabase.',
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
 * Single Authoritative Yearly Interest Calculation Engine
 */
export function calculateYearlyInterestDetails(
  transactions: any[],
  annualRate: number,
  interestType: 'simple' | 'compound',
  asOfDateStr?: string
): {
  totalAccruedInterest: number;
  currentCapital: number;
  totalInvestmentValue: number;
  totalCapitalAdded: number;
  totalCapitalWithdrawn: number;
  elapsedDaysForPrimaryCap: number;
  remarks: string;
  periods?: any[];
} {
  const summary = calculateYearlyBreakdown(transactions, annualRate, interestType, asOfDateStr);
  const primaryElapsed = summary.periods.reduce((sum, p) => sum + p.elapsedDays, 0);

  return {
    totalAccruedInterest: summary.totalAccruedInterest,
    currentCapital: summary.currentCapital,
    totalInvestmentValue: summary.totalInvestmentValue,
    totalCapitalAdded: summary.totalCapitalAdded,
    totalCapitalWithdrawn: summary.totalCapitalWithdrawn,
    elapsedDaysForPrimaryCap: primaryElapsed,
    remarks: `Annual ${interestType === 'compound' ? 'Compound' : 'Simple'} Interest @ ${annualRate}%/year`,
    periods: summary.periods,
  };
}

let accrualInFlight: Promise<{ success: boolean; accruedMonths?: number }> | null = null;

async function executeAutoAccrueInternal(): Promise<{ success: boolean; accruedMonths?: number }> {
  const supabase = createClient();
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayISO = `${yyyy}-${mm}-${dd}`;
    const currentYearKey = `${yyyy}`;

    // Fetch all transactions to compute active capital additions and dates
    const { data: txData } = await supabase.from('investment_transactions').select('*');
    const transactions = txData || [];

    const { annualInterestRate, interestType } = await getInvestmentSettings();

    const calc = calculateYearlyInterestDetails(transactions, annualInterestRate, interestType, todayISO);

    // Purge any stale interest rows (monthly_interest, Daily Interest, or outdated yearly_interest refIds)
    const periods = calc.periods || [];
    const activeRefIds = periods.map((p: any) => `yearly_${p.startDate}_${p.endDate}`);

    const { data: allInterestRows } = await supabase
      .from('investment_transactions')
      .select('id, reference_id')
      .or(`reference_type.eq.monthly_interest,reference_type.eq.yearly_interest,transaction_type.eq.Daily Interest,transaction_type.eq.Annual Interest`);

    if (allInterestRows && allInterestRows.length > 0) {
      const staleRowIds = allInterestRows
        .filter((r: any) => !r.reference_id || !activeRefIds.includes(r.reference_id))
        .map((r: any) => r.id);

      if (staleRowIds.length > 0) {
        await supabase
          .from('investment_transactions')
          .delete()
          .in('id', staleRowIds);
      }
    }

    // Persist each period breakdown row into investment_transactions table with reference_type = 'yearly_interest'
    for (const period of periods) {
      const refId = `yearly_${period.startDate}_${period.endDate}`;

      const { data: existing } = await supabase
        .from('investment_transactions')
        .select('id')
        .eq('reference_type', 'yearly_interest')
        .eq('reference_id', refId)
        .limit(1);

      const payload = {
        transaction_date: period.endDate,
        transaction_type: 'Annual Interest',
        opening_balance: period.openingBalance,
        amount_in: 0,
        amount_out: 0,
        interest_rate: annualInterestRate,
        daily_interest_added: period.interestEarned,
        balance: period.closingBalance,
        reference_type: 'yearly_interest',
        reference_id: refId,
        remarks: `${period.periodLabel} | ${period.remarks}`,
      };

      if (existing && existing.length > 0) {
        await supabase
          .from('investment_transactions')
          .update(payload)
          .eq('id', existing[0].id);
      } else {
        await supabase.from('investment_transactions').insert([payload]);
      }
    }

    return { success: true, accruedMonths: 1 };
  } catch (err: any) {
    console.warn('Yearly interest accrual notice:', err);
    return { success: false, accruedMonths: 0 };
  }
}

/**
 * Auto-Accrue Monthly Investment Interest (Idempotent & Duplication-Proof)
 * Serialized via in-flight promise lock to prevent concurrent Promise.all race conditions!
 */
export async function autoAccrueMonthlyInvestmentInterest(): Promise<{ success: boolean; accruedMonths?: number }> {
  if (accrualInFlight) {
    return accrualInFlight;
  }
  accrualInFlight = (async () => {
    try {
      return await executeAutoAccrueInternal();
    } finally {
      accrualInFlight = null;
    }
  })();
  return accrualInFlight;
}

/**
 * 3. Add Daily Simple Interest Trigger (Legacy Compatibility Hook)
 */
export async function addDailyInterest(
  daysCount: number = 1,
  customDate?: string
): Promise<{ success: boolean; interestAdded?: number; error?: string }> {
  try {
    const res = await autoAccrueMonthlyInvestmentInterest();

    const supabase = createClient();
    const { data: yearlyTx } = await supabase
      .from('investment_transactions')
      .select('daily_interest_added')
      .eq('reference_type', 'yearly_interest');

    const totalInterestAccrued = (yearlyTx || []).reduce(
      (sum: number, t: any) => sum + Number(t.daily_interest_added || 0),
      0
    );

    return {
      success: true,
      interestAdded: Math.round(totalInterestAccrued * 100) / 100,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to check yearly interest' };
  }
}

/**
 * 4. Add Capital (Direct Investment)
 */
export async function addCapital(formData: AddCapitalFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const amountNum = Number(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: 'Investment amount must be greater than ₹0.' };
    }

    if (formData.annualInterestRate !== undefined && !isNaN(Number(formData.annualInterestRate))) {
      await updateInvestmentSettings({
        annualInterestRate: Number(formData.annualInterestRate),
        interestType: formData.interestType || 'simple',
      });
    }

    const sourceStr = (formData.source || 'Direct Investment').trim();
    const remarks = `Direct Investment via ${sourceStr}${formData.remarks && formData.remarks.trim() ? ' | ' + formData.remarks.trim() : ''}`;

    const res = await recordInvestmentTransaction(
      'Capital Added',
      amountNum,
      0,
      'capital',
      undefined,
      remarks,
      formData.transactionDate || new Date().toISOString().split('T')[0]
    );

    if (!res.success) {
      console.error('addCapital failed:', res.error);
    }

    return res;
  } catch (err: any) {
    console.error('addCapital unexpected error:', err);
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * 5. Record Business Withdrawal / Take Capital
 * Strict Business Rule:
 * - Withdrawal amount > 0
 * - Withdrawal amount <= available capital
 * - Fast & Persisted in Supabase
 */
export async function recordBusinessWithdrawal(
  formData: BusinessWithdrawalFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!formData.amount || formData.amount <= 0) {
      return { success: false, error: 'Withdrawal amount must be greater than ₹0.' };
    }

    const supabase = createClient();

    // Fetch transactions & settings in parallel in 1 network round-trip
    const [{ data: txData }, { monthlyInterestRate }] = await Promise.all([
      supabase.from('investment_transactions').select('*').order('created_at', { ascending: false }),
      getInvestmentSettings(),
    ]);

    const transactions = txData || [];

    // Compute current capital (Direct Investments + Chits + Deposits - Withdrawals)
    const totalCapitalAdded = transactions
      .filter((t: any) =>
        t.transaction_type === 'Capital Added' ||
        t.transaction_type === 'Chit Prize Received' ||
        t.transaction_type === 'Deposit Received' ||
        t.transaction_type === 'Withdrawal Return'
      )
      .reduce((sum: number, t: any) => sum + Number(t.amount_in || 0), 0);

    const totalCapitalWithdrawn = transactions
      .filter((t: any) =>
        t.transaction_type === 'Business Withdrawal' ||
        t.transaction_type === 'Capital Returned'
      )
      .reduce((sum: number, t: any) => sum + Number(t.amount_out || 0), 0);

    const availableCapital = Math.max(0, totalCapitalAdded - totalCapitalWithdrawn);

    if (formData.amount > availableCapital) {
      return {
        success: false,
        error: `Withdrawal amount (₹${formData.amount.toLocaleString('en-IN')}) exceeds available capital (₹${availableCapital.toLocaleString('en-IN')}).`,
      };
    }

    // Calculate current running cash balance
    let currentBalance = 0;
    const sorted = [...transactions].sort((a: any, b: any) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    for (const tx of sorted) {
      const amtIn = Number(tx.amount_in || 0);
      const amtOut = Number(tx.amount_out || 0);
      currentBalance = Math.round((currentBalance + amtIn - amtOut) * 100) / 100;
    }

    const withdrawalDate = formData.withdrawalDate || new Date().toISOString().split('T')[0];
    const remarks = `Business Withdrawal${formData.remarks ? ' | ' + formData.remarks : ''}`;
    const openingBalance = currentBalance;
    const closingBalance = Math.round((openingBalance - formData.amount) * 100) / 100;

    const payload = {
      transaction_date: withdrawalDate,
      transaction_type: 'Business Withdrawal',
      opening_balance: Math.round(openingBalance * 100) / 100,
      amount_in: 0,
      amount_out: Number(formData.amount),
      interest_rate: monthlyInterestRate,
      daily_interest_added: 0,
      balance: closingBalance,
      reference_type: 'withdrawal',
      reference_id: null,
      remarks: remarks,
    };

    const { error: insertError } = await supabase.from('investment_transactions').insert([payload]);

    if (insertError) {
      return { success: false, error: formatSupabaseError(insertError) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record business withdrawal' };
  }
}

/**
 * 6. Record Withdrawal Return
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
 * Update an existing investment transaction by reference_type and reference_id (Idempotent Hook)
 */
export async function updateInvestmentTransactionByReference(
  referenceType: string,
  referenceId: string,
  amountIn: number,
  amountOut: number,
  remarks?: string,
  transactionDate?: string,
  dailyInterestOverride?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data: existingList } = await supabase
      .from('investment_transactions')
      .select('id')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .limit(1);

    const existing = existingList && existingList.length > 0 ? existingList[0] : null;

    if (existing) {
      const payload: any = {
        amount_in: Number(amountIn || 0),
        amount_out: Number(amountOut || 0),
      };
      if (dailyInterestOverride !== undefined) {
        payload.daily_interest_added = Number(dailyInterestOverride);
      }
      if (remarks) payload.remarks = remarks;
      if (transactionDate) payload.transaction_date = transactionDate;

      const { error } = await supabase
        .from('investment_transactions')
        .update(payload)
        .eq('id', existing.id);

      if (error && !isTableNotFoundError(error)) {
        return { success: false, error: formatSupabaseError(error) };
      }

      return { success: true };
    } else {
      const mappedType = referenceType === 'chit_prize'
        ? 'Chit Prize Received'
        : (referenceType === 'depositor'
            ? 'Deposit Received'
            : (referenceType === 'chit_payment' ? 'Chit Installment' : (referenceType === 'monthly_interest' ? 'Daily Interest' : 'Capital Added')));

      return await recordInvestmentTransaction(
        mappedType,
        amountIn,
        amountOut,
        referenceType,
        referenceId,
        remarks,
        transactionDate,
        dailyInterestOverride
      );
    }
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err) };
  }
}

/**
 * Delete an investment transaction by reference_type and reference_id
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

    return { success: true };
  } catch (err: any) {
    return { success: true };
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
    await autoAccrueMonthlyInvestmentInterest();

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
 * 8. Get Investment Metrics Summary (Ultra-Fast Parallel Queries & Pure Calculations)
 */
export async function getInvestmentMetrics(): Promise<{ success: boolean; data: InvestmentMetrics; error?: string }> {
  const supabase = createClient();

  try {
    await autoAccrueMonthlyInvestmentInterest();

    const [
      { data: txData },
      { data: loansData },
      { data: expensesData },
      settings
    ] = await Promise.all([
      supabase.from('investment_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('loans').select('amount_given, total_collection, total_collection_amount, is_closed'),
      supabase.from('expenses').select('amount'),
      getInvestmentSettings()
    ]);

    const annualInterestRate = settings.annualInterestRate;
    const interestType = settings.interestType;
    const monthlyInterestRate = Math.round((annualInterestRate / 12) * 100) / 100;
    const rawTransactions = txData || [];
    const calc = calculateYearlyInterestDetails(rawTransactions, annualInterestRate, interestType);

    // Running cash balance (excluding interest entries from cash pool)
    const chronological = [...rawTransactions].sort((a: any, b: any) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let runningBal = 0;
    for (const tx of chronological) {
      const amtIn = Number(tx.amount_in || 0);
      const amtOut = Number(tx.amount_out || 0);
      runningBal = Math.round((runningBal + amtIn - amtOut) * 100) / 100;
      tx.balance = runningBal;
    }

    const currentBalance = runningBal;

    // Loan Interest (Total interest earned from active loans)
    const loans = loansData || [];
    const loanInterest = loans
      .filter((l: any) => !l.is_closed)
      .reduce((sum: number, l: any) => {
        const given = Number(l.amount_given || 0);
        const target = Number(l.total_collection || l.total_collection_amount || 0);
        return sum + Math.max(0, target - given);
      }, 0);

    // Expenses
    const expenses = (expensesData || []).reduce(
      (sum: number, e: any) => sum + Number(e.amount || 0),
      0
    );

    const netProfit = Math.round((loanInterest - calc.totalAccruedInterest - expenses) * 100) / 100;

    return {
      success: true,
      data: {
        ownerCapital: calc.currentCapital,
        currentBalance: Math.round(currentBalance * 100) / 100,
        totalWorkingCapital: Math.round(currentBalance * 100) / 100,
        investmentInterest: calc.totalAccruedInterest,
        loanInterest: Math.round(loanInterest * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        businessWithdrawals: calc.totalCapitalWithdrawn,
        netProfit,
        monthlyInterestRate,
        annualInterestRate,
        interestType,
        totalCapitalAdded: calc.totalCapitalAdded,
        totalCapitalWithdrawn: calc.totalCapitalWithdrawn,
        currentCapital: calc.currentCapital,
        accruedInterest: calc.totalAccruedInterest,
        totalInvestmentValue: calc.totalInvestmentValue,
      },
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        ownerCapital: 0,
        currentBalance: 0,
        totalWorkingCapital: 0,
        investmentInterest: 0,
        loanInterest: 0,
        expenses: 0,
        businessWithdrawals: 0,
        netProfit: 0,
        monthlyInterestRate: 1.5,
        annualInterestRate: 18,
        interestType: 'simple',
        totalCapitalAdded: 0,
        totalCapitalWithdrawn: 0,
        currentCapital: 0,
        accruedInterest: 0,
        totalInvestmentValue: 0,
      },
    };
  }
}
