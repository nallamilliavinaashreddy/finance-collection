import { createClient } from '@/lib/supabase/client';
import { Loan, LoanStatus, LoanType } from '@/types';
import { LoanFormData } from '@/lib/validations/loan';
import { recordInvestmentTransaction, deleteInvestmentTransactionByReference } from '@/lib/actions/investment';
import { autoAccrueAdjustmentInterest } from '@/lib/actions/adjustment-ledger';

/**
 * Decodes LoanType stored in Supabase PostgreSQL (or encoded in working_days)
 */
export function decodeLoanType(workingDaysRaw: any, storedTypeRaw?: any): LoanType {
  if (storedTypeRaw && ['daily', 'weekly', 'monthly', 'adjustment'].includes(String(storedTypeRaw).toLowerCase())) {
    return String(storedTypeRaw).toLowerCase() as LoanType;
  }
  const w = Number(workingDaysRaw || 100);
  if (w >= 7000 && w < 8000) return 'weekly';
  if (w >= 8000 && w < 9000) return 'monthly';
  if (w >= 9000) return 'adjustment';
  return 'daily';
}

/**
 * Encodes LoanType into working_days for guaranteed database persistence in Supabase
 */
export function encodeWorkingDays(loanType: LoanType, workingDays?: number, totalWeeks?: number, totalMonths?: number, interestRate?: number): number {
  if (loanType === 'weekly') return 7000 + (Number(totalWeeks) || 10);
  if (loanType === 'monthly') return 8000 + (Number(totalMonths) || 6);
  if (loanType === 'adjustment') {
    const rate = Number(interestRate) || 6;
    return 9000 + Math.round(rate);
  }
  return Number(workingDays) || 100;
}

export function decodeInterestRate(workingDaysRaw: any, storedRateRaw?: any): number {
  if (storedRateRaw !== undefined && storedRateRaw !== null && Number(storedRateRaw) > 0) {
    return Number(storedRateRaw);
  }
  const w = Number(workingDaysRaw || 0);
  if (w >= 9000) {
    const diff = w - 9000;
    return diff > 0 ? diff : 6;
  }
  return 6;
}

export function decodeTotalWeeks(workingDaysRaw: any, storedWeeks?: any): number {
  if (storedWeeks && Number(storedWeeks) > 0) return Number(storedWeeks);
  const w = Number(workingDaysRaw || 0);
  if (w >= 7000 && w < 8000) return w - 7000;
  return 10;
}

export function decodeTotalMonths(workingDaysRaw: any, storedMonths?: any): number {
  if (storedMonths && Number(storedMonths) > 0) return Number(storedMonths);
  const w = Number(workingDaysRaw || 0);
  if (w >= 8000 && w < 9000) return w - 8000;
  return 6;
}

// 1. Get Loans from Supabase with JOIN on customers table
export async function getLoans(
  searchQuery: string = '',
  statusFilter: string = 'all',
  typeFilter: string = 'all'
): Promise<{ success: boolean; data: Loan[]; error?: string }> {
  const supabase = createClient();

  try {
    // Run auto accrual for active adjustment loans first to ensure up-to-date balances
    await autoAccrueAdjustmentInterest();

    const { data, error } = await supabase
      .from('loans')
      .select('*, customers(id, customer_id, customer_name, mobile_number), collections(id, amount_paid)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getLoans query error:', error);
      return { success: false, data: [], error: error.message };
    }

    let formatted: Loan[] = (data || []).map((item: any) => {
      const cust = item.customers || {};
      const actualCollected = (item.collections || []).reduce(
        (sum: number, c: any) => sum + Number(c.amount_paid || 0),
        0
      );
      const totalTarget = Number(item.total_collection || item.total_collection_amount || 0);
      const balance = Math.max(0, totalTarget - actualCollected);

      const isClosedVal = item.is_closed !== undefined && item.is_closed !== null
        ? Boolean(item.is_closed)
        : balance <= 0;

      const endDateDate = item.end_date ? new Date(item.end_date) : null;
      const isPastDue = endDateDate ? new Date() > endDateDate : false;
      const inferredStatus: LoanStatus = isClosedVal ? 'closed' : (item.status ? (item.status as LoanStatus) : (isPastDue ? 'closed' : 'active'));

      const lType: LoanType = decodeLoanType(item.working_days, item.loan_type);
      const totalWks = decodeTotalWeeks(item.working_days, item.total_weeks);
      const totalMths = decodeTotalMonths(item.working_days, item.total_months);
      const daysCount = lType === 'daily' ? Number(item.working_days || 100) : 100;

      const rateVal = lType === 'adjustment'
        ? decodeInterestRate(item.working_days, item.monthly_interest_rate || item.interest_rate)
        : 0;

      return {
        id: item.id,
        customerId: item.customer_id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Unknown Customer',
        mobileNumber: cust.mobile_number,
        loanType: lType,
        city: item.city || undefined,
        amountGiven: Number(item.amount_given || 0),
        totalCollectionAmount: totalTarget,
        interestRate: rateVal,
        workingDays: daysCount,
        totalWeeks: totalWks,
        totalMonths: totalMths,
        dailyAmount: item.daily_amount ? Number(item.daily_amount) : Math.round((totalTarget / daysCount) * 100) / 100,
        weeklyAmount: item.weekly_amount ? Number(item.weekly_amount) : Math.round((totalTarget / Math.max(1, totalWks)) * 100) / 100,
        monthlyAmount: item.monthly_amount ? Number(item.monthly_amount) : Math.round((totalTarget / Math.max(1, totalMths)) * 100) / 100,
        collectedAmount: actualCollected,
        balanceAmount: balance,
        isClosed: isClosedVal,
        startDate: item.start_date,
        endDate: item.end_date,
        status: inferredStatus,
        createdAt: item.created_at,
      };
    });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      formatted = formatted.filter(
        (item) =>
          item.customerName.toLowerCase().includes(q) ||
          item.customerCode.toLowerCase().includes(q) ||
          (item.mobileNumber && item.mobileNumber.toLowerCase().includes(q))
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      formatted = formatted.filter((item) => item.status === statusFilter);
    }

    if (typeFilter && typeFilter !== 'all') {
      formatted = formatted.filter((item) => item.loanType === typeFilter);
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error fetching loans from Supabase:', err);
    return { success: false, data: [], error: err?.message || 'Failed to fetch loans' };
  }
}

// 2. Create Loan in Supabase
export async function createLoan(formData: LoanFormData): Promise<{ success: boolean; data?: Loan; error?: string }> {
  const supabase = createClient();

  try {
    const resolvedInterestRate = formData.interestRate !== undefined ? formData.interestRate : (formData.loanType === 'adjustment' ? 6 : 0);
    const encodedDays = encodeWorkingDays(formData.loanType, formData.workingDays, formData.totalWeeks, formData.totalMonths, resolvedInterestRate);

    // Exact Schema Matching Payload
    const payloadFull: Record<string, any> = {
      customer_id: formData.customerId,
      amount_given: formData.amountGiven,
      total_collection: formData.totalCollectionAmount,
      working_days: encodedDays,
      daily_amount: formData.dailyAmount || 0,
      collected_amount: 0,
      balance_amount: formData.totalCollectionAmount,
      is_closed: false,
      start_date: formData.startDate,
      end_date: formData.endDate,
    };

    let data: any = null;
    let error: any = null;

    const res = await supabase
      .from('loans')
      .insert([payloadFull])
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .single();

    data = res.data;
    error = res.error;

    if (error || !data) {
      console.error('Supabase insert loan error:', error);
      return { success: false, error: error?.message || 'Failed to create loan' };
    }

    const cust = data.customers || {};
    const target = Number(data.total_collection || formData.totalCollectionAmount);
    const resolvedType = decodeLoanType(data.working_days);

    const newLoan: Loan = {
      id: data.id,
      customerId: data.customer_id,
      customerCode: cust.customer_id || 'N/A',
      customerName: cust.customer_name || 'Customer',
      mobileNumber: cust.mobile_number,
      loanType: resolvedType,
      city: formData.city,
      amountGiven: Number(data.amount_given || 0),
      totalCollectionAmount: target,
      interestRate: resolvedInterestRate,
      workingDays: formData.workingDays || 100,
      totalWeeks: formData.totalWeeks || 10,
      totalMonths: formData.totalMonths || 6,
      dailyAmount: Number(formData.dailyAmount || 0),
      weeklyAmount: Number(formData.weeklyAmount || 0),
      monthlyAmount: Number(formData.monthlyAmount || 0),
      collectedAmount: Number(data.collected_amount || 0),
      balanceAmount: Number(data.balance_amount || target),
      isClosed: Boolean(data.is_closed),
      startDate: data.start_date,
      endDate: data.end_date,
      status: (data.status as LoanStatus) || 'active',
      createdAt: data.created_at,
    };

    // If Adjustment loan, create initial disbursement entry in adjustment_ledger table
    if (resolvedType === 'adjustment') {
      try {
        await supabase.from('adjustment_ledger').insert([
          {
            loan_id: data.id,
            transaction_date: formData.startDate,
            transaction_type: 'disbursement',
            opening_balance: 0,
            interest_rate: resolvedInterestRate,
            interest_added: 0,
            payment_received: 0,
            closing_balance: formData.totalCollectionAmount,
            remarks: `Initial Principal Disbursed: ₹${formData.amountGiven} (@ ${resolvedInterestRate}%/mo)`,
          },
        ]);
      } catch (lErr) {
        console.warn('Adjustment ledger initial insertion notice:', lErr);
      }
    }

    // Automatically record loan disbursement in Investment Khata
    try {
      await recordInvestmentTransaction(
        'Loan Given',
        0,
        formData.amountGiven,
        'loan',
        data.id,
        `Loan Given to ${cust.customer_name || 'Customer'} (${cust.customer_id || 'ID'})`,
        formData.startDate
      );
    } catch (invErr) {
      console.warn('Investment Khata loan hook notice:', invErr);
    }

    return { success: true, data: newLoan };
  } catch (err: any) {
    console.error('Unexpected error creating loan in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to create loan' };
  }
}

// 3. Update Loan in Supabase
export async function updateLoan(
  id: string,
  formData: LoanFormData
): Promise<{ success: boolean; data?: Loan; error?: string }> {
  const supabase = createClient();

  try {
    const resolvedInterestRate = formData.interestRate !== undefined ? formData.interestRate : (formData.loanType === 'adjustment' ? 6 : 0);
    const encodedDays = encodeWorkingDays(formData.loanType, formData.workingDays, formData.totalWeeks, formData.totalMonths, resolvedInterestRate);

    // Exact Schema Matching Payload (12 columns)
    const payloadFull: Record<string, any> = {
      customer_id: formData.customerId,
      amount_given: formData.amountGiven,
      total_collection: formData.totalCollectionAmount,
      working_days: encodedDays,
      daily_amount: formData.dailyAmount || 0,
      start_date: formData.startDate,
      end_date: formData.endDate,
    };

    let data: any = null;
    let error: any = null;

    const res = await supabase
      .from('loans')
      .update(payloadFull)
      .eq('id', id)
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .single();

    data = res.data;
    error = res.error;

    if (error || !data) {
      console.error('Supabase update loan error:', error);
      return { success: false, error: error?.message || 'Failed to update loan' };
    }

    const cust = data.customers || {};
    const collected = Number(data.collected_amount || 0);
    const totalTarget = Number(data.total_collection || 0);
    const balance = data.balance_amount !== undefined ? Number(data.balance_amount) : Math.max(0, totalTarget - collected);
    const resolvedType = decodeLoanType(data.working_days, data.loan_type || formData.loanType);

    const updatedLoan: Loan = {
      id: data.id,
      customerId: data.customer_id,
      customerCode: cust.customer_id || 'N/A',
      customerName: cust.customer_name || 'Customer',
      mobileNumber: cust.mobile_number,
      loanType: resolvedType,
      city: data.city || formData.city,
      amountGiven: Number(data.amount_given || 0),
      totalCollectionAmount: totalTarget,
      interestRate: resolvedInterestRate,
      workingDays: Number(data.working_days || 100),
      totalWeeks: Number(data.total_weeks || 10),
      totalMonths: Number(data.total_months || 6),
      dailyAmount: Number(data.daily_amount || 0),
      weeklyAmount: Number(data.weekly_amount || 0),
      monthlyAmount: Number(data.monthly_amount || 0),
      collectedAmount: collected,
      balanceAmount: balance,
      isClosed: Boolean(data.is_closed),
      startDate: data.start_date,
      endDate: data.end_date,
      status: (data.status as LoanStatus) || 'active',
      createdAt: data.created_at,
    };

    return { success: true, data: updatedLoan };
  } catch (err: any) {
    console.error('Unexpected error updating loan in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to update loan' };
  }
}

// 4. Delete Loan from Supabase
export async function deleteLoan(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Find associated stamps before deleting loan
    const { data: stamps } = await supabase.from('stamps').select('id').eq('loan_id', id);

    const { error } = await supabase.from('loans').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete loan error:', error);
      return { success: false, error: error.message };
    }

    // Automatically remove Investment transaction for Loan Given
    try {
      await deleteInvestmentTransactionByReference('loan', id);
    } catch (invErr) {
      console.warn('Notice: Failed deleting investment transaction for loan:', id, invErr);
    }

    // Automatically remove Investment transactions for associated stamps
    if (stamps && stamps.length > 0) {
      for (const st of stamps) {
        try {
          await deleteInvestmentTransactionByReference('stamp', st.id);
        } catch (stErr) {
          console.warn('Notice: Failed deleting stamp investment transaction:', st.id, stErr);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting loan from Supabase:', err);
    return { success: false, error: err?.message || 'Failed to delete loan' };
  }
}
