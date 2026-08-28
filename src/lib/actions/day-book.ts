import { createClient } from '@/lib/supabase/client';
import { decodeLoanType } from '@/lib/actions/loans';
import {
  DayBookData,
  DayBookEntry,
  DailyCollectionSummary,
  CashManagementSummary,
  DayBookSourceModule,
} from '@/types';

function parseUTCDate(dateStr: string): number {
  if (!dateStr) return 0;
  const clean = String(dateStr).trim().split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return 0;
  return Date.UTC(yyyy, mm, dd);
}

const MIRROR_REFERENCE_TYPES = new Set([
  'loan',
  'collection',
  'expense',
  'stamp',
  'chit',
  'depositor',
  'salary',
  'employee',
]);

function isMirrorInvestmentTransaction(i: any): boolean {
  if (!i) return false;
  const refType = (i.reference_type || '').toLowerCase();
  return MIRROR_REFERENCE_TYPES.has(refType);
}

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === '42P01' ||
    (error.message || '').includes('does not exist') ||
    (error.message || '').includes('Could not find the table') ||
    (error.message || '').includes('schema cache')
  );
}

export async function getDayBookData(
  dateISOOrStart?: string,
  endDateISO?: string
): Promise<{
  success: boolean;
  data: DayBookData | null;
  error?: string;
}> {
  const supabase = createClient();
  const todayISO = new Date().toISOString().split('T')[0];

  const startDate = dateISOOrStart || todayISO;
  const endDate = endDateISO || startDate;
  const isDateRange = startDate !== endDate;
  const activeDate = startDate;

  try {
    // 1. Calculate Historical Opening Cash (All actual cash transactions strictly before startDate)
    const [
      resPrevCols,
      resPrevLoans,
      resPrevExp,
      resPrevInvest,
      resPrevDep,
      resPrevStamps,
      resPrevSalaries,
      resPrevReversals,
    ] = await Promise.all([
      supabase.from('collections').select('amount_paid, payment_date').lt('payment_date', startDate),
      supabase.from('loans').select('amount_given, start_date').lt('start_date', startDate),
      supabase.from('expenses').select('amount, expense_date').lt('expense_date', startDate),
      supabase
        .from('investment_transactions')
        .select('amount_in, amount_out, transaction_date, reference_type, transaction_type')
        .lt('transaction_date', startDate),
      supabase.from('depositor_transactions').select('amount_in, amount_out, transaction_date').lt('transaction_date', startDate),
      supabase.from('stamps').select('amount, stamp_date').lt('stamp_date', startDate),
      supabase.from('employee_salaries').select('net_salary_paid, payment_date').lt('payment_date', startDate),
      supabase.from('transaction_reversals').select('reversal_amount, reversal_type, reversal_date').lt('reversal_date', startDate),
    ]);

    const prevCols = resPrevCols.data || [];
    const prevLoans = resPrevLoans.data || [];
    const prevExp = resPrevExp.data || [];
    const prevInvest = resPrevInvest.data || [];
    const prevDep = resPrevDep.data || [];
    const prevStamps = resPrevStamps.data || [];
    const prevSalaries = resPrevSalaries.data || [];
    const prevReversals = resPrevReversals?.error && isTableNotFoundError(resPrevReversals.error) ? [] : (resPrevReversals?.data || []);

    let openingCash = 0;

    // Add historical Inflows
    prevCols.forEach((c: any) => (openingCash += Number(c.amount_paid || 0)));
    prevInvest.forEach((i: any) => {
      if (
        i.reference_type !== 'yearly_interest' &&
        i.transaction_type !== 'Annual Interest' &&
        !isMirrorInvestmentTransaction(i)
      ) {
        openingCash += Number(i.amount_in || 0);
      }
    });
    prevDep.forEach((d: any) => (openingCash += Number(d.amount_in || 0)));

    // Subtract historical Outflows
    prevLoans.forEach((l: any) => (openingCash -= Number(l.amount_given || 0)));
    prevExp.forEach((e: any) => (openingCash -= Number(e.amount || 0)));
    prevInvest.forEach((i: any) => {
      if (
        i.reference_type !== 'yearly_interest' &&
        i.transaction_type !== 'Annual Interest' &&
        !isMirrorInvestmentTransaction(i)
      ) {
        openingCash -= Number(i.amount_out || 0);
      }
    });
    prevDep.forEach((d: any) => (openingCash -= Number(d.amount_out || 0)));
    prevStamps.forEach((s: any) => (openingCash -= Number(s.amount || 0)));
    prevSalaries.forEach((s: any) => (openingCash -= Number(s.net_salary_paid || 0)));

    // Historical Reversals
    prevReversals.forEach((r: any) => {
      if (r.reversal_type === 'cash_in') openingCash += Number(r.reversal_amount || 0);
      else if (r.reversal_type === 'cash_out') openingCash -= Number(r.reversal_amount || 0);
    });

    openingCash = Math.round(openingCash * 100) / 100;

    // 2. Fetch Transactions for range [startDate, endDate]
    const [
      resDayCols,
      resDayLoans,
      resDayExp,
      resDayInvest,
      resDayDep,
      resDayStamps,
      resDaySalaries,
      resDayReversals,
      resDayClosure,
    ] = await Promise.all([
      supabase
        .from('collections')
        .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate),
      supabase
        .from('loans')
        .select('*, customers(id, customer_id, customer_name, mobile_number)')
        .gte('start_date', startDate)
        .lte('start_date', endDate),
      supabase.from('expenses').select('*').gte('expense_date', startDate).lte('expense_date', endDate),
      supabase
        .from('investment_transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate),
      supabase
        .from('depositor_transactions')
        .select('*, depositors(name)')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate),
      supabase.from('stamps').select('*, customers(customer_name)').gte('stamp_date', startDate).lte('stamp_date', endDate),
      supabase.from('employee_salaries').select('*, employees(employee_name)').gte('payment_date', startDate).lte('payment_date', endDate),
      supabase.from('transaction_reversals').select('*').gte('reversal_date', startDate).lte('reversal_date', endDate),
      supabase.from('daily_cash_closures').select('*').eq('closure_date', endDate).maybeSingle(),
    ]);

    const dayCols = resDayCols.data || [];
    const dayLoans = resDayLoans.data || [];
    const dayExp = resDayExp.data || [];
    const dayInvest = resDayInvest.data || [];
    const dayDep = resDayDep.data || [];
    const dayStamps = resDayStamps.data || [];
    const daySalaries = resDaySalaries.data || [];
    const dayReversals = resDayReversals?.error && isTableNotFoundError(resDayReversals.error) ? [] : (resDayReversals?.data || []);
    const dayClosure = resDayClosure?.error && isTableNotFoundError(resDayClosure.error) ? null : (resDayClosure?.data || null);

    const rawEntries: any[] = [];
    const collectionSummary: DailyCollectionSummary = {
      dailyCollection: 0,
      weeklyCollection: 0,
      monthlyInterest: 0,
      monthlyPrincipal: 0,
      emiCollection: 0,
      otherCollection: 0,
      totalCollection: 0,
    };

    // Process Collections
    dayCols.forEach((c: any) => {
      const amt = Number(c.amount_paid || 0);
      if (amt <= 0) return;

      const loan = c.loans || {};
      const cust = loan.customers || {};
      const loanType = decodeLoanType(loan.working_days, loan.loan_type);

      let sourceMod: DayBookSourceModule = 'daily_finance';
      let typeLabel = 'Collection';

      if (loanType === 'daily') {
        collectionSummary.dailyCollection += amt;
        sourceMod = 'daily_finance';
        typeLabel = 'Daily Collection';
      } else if (loanType === 'weekly') {
        collectionSummary.weeklyCollection += amt;
        sourceMod = 'weekly_finance';
        typeLabel = 'Weekly Collection';
      } else if (loanType === 'monthly') {
        if (c.remarks?.toLowerCase().includes('interest') || c.payment_type === 'interest') {
          collectionSummary.monthlyInterest += amt;
          typeLabel = 'Monthly Interest';
        } else {
          collectionSummary.monthlyPrincipal += amt;
          typeLabel = 'Monthly Principal';
        }
        sourceMod = 'monthly_finance';
      } else if (loanType === 'adjustment') {
        collectionSummary.emiCollection += amt;
        typeLabel = 'EMI Collection';
        sourceMod = 'daily_finance';
      } else {
        collectionSummary.otherCollection += amt;
        typeLabel = 'Collection';
      }

      collectionSummary.totalCollection += amt;

      rawEntries.push({
        id: `col_${c.id}`,
        time: c.created_at ? new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        date: c.payment_date || activeDate,
        rawTimestamp: c.created_at ? new Date(c.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: sourceMod,
        sourceTransactionId: c.id,
        transactionType: typeLabel,
        customerOrAccountName: cust.customer_name || 'Customer',
        loanOrRefCode: loan.loan_id || 'LOAN',
        description: c.remarks || `${typeLabel} received`,
        cashIn: amt,
        cashOut: 0,
        collectorOrUser: 'Admin',
      });
    });

    // Process Loan Disbursements
    dayLoans.forEach((l: any) => {
      const amt = Number(l.amount_given || 0);
      if (amt <= 0) return;

      const cust = l.customers || {};
      const lType = decodeLoanType(l.working_days, l.loan_type);

      rawEntries.push({
        id: `loan_${l.id}`,
        time: l.created_at ? new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:00 AM',
        date: l.start_date || activeDate,
        rawTimestamp: l.created_at ? new Date(l.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: 'loan_disbursement',
        sourceTransactionId: l.id,
        transactionType: `${lType.toUpperCase()} Loan Disbursement`,
        customerOrAccountName: cust.customer_name || 'Customer',
        loanOrRefCode: l.loan_id || 'NEW LOAN',
        description: `Loan Amount Disbursed to ${cust.customer_name || 'Customer'}`,
        cashIn: 0,
        cashOut: amt,
        collectorOrUser: 'Admin',
      });
    });

    // Process Office Expenses
    dayExp.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      if (amt <= 0) return;

      rawEntries.push({
        id: `exp_${e.id}`,
        time: e.created_at ? new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '02:00 PM',
        date: e.expense_date || activeDate,
        rawTimestamp: e.created_at ? new Date(e.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: 'expense',
        sourceTransactionId: e.id,
        transactionType: `Office Expense (${e.category || 'General'})`,
        customerOrAccountName: e.category || 'Office Expense',
        loanOrRefCode: 'EXPENSE',
        description: e.description || e.remarks || 'Office Expense',
        cashIn: 0,
        cashOut: amt,
        collectorOrUser: e.paid_to || 'Admin',
      });
    });

    // Process Investment & Owner Transactions
    dayInvest.forEach((i: any) => {
      if (
        i.reference_type === 'yearly_interest' ||
        i.transaction_type === 'Annual Interest' ||
        isMirrorInvestmentTransaction(i)
      ) {
        return;
      }

      const inAmt = Number(i.amount_in || 0);
      const outAmt = Number(i.amount_out || 0);

      if (inAmt > 0) {
        rawEntries.push({
          id: `inv_in_${i.id}`,
          time: i.created_at ? new Date(i.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '03:00 PM',
          date: i.transaction_date || activeDate,
          rawTimestamp: i.created_at ? new Date(i.created_at).getTime() : parseUTCDate(activeDate),
          sourceModule: 'investment',
          sourceTransactionId: i.id,
          transactionType: i.transaction_type || 'Capital Added',
          customerOrAccountName: 'Owner / Investor',
          loanOrRefCode: 'INVESTMENT',
          description: i.remarks || 'Investment Capital Received',
          cashIn: inAmt,
          cashOut: 0,
          collectorOrUser: 'Admin',
        });
      }

      if (outAmt > 0) {
        const isDrawing = i.transaction_type === 'Business Withdrawal' || i.transaction_type === 'Capital Returned';
        rawEntries.push({
          id: `inv_out_${i.id}`,
          time: i.created_at ? new Date(i.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '04:00 PM',
          date: i.transaction_date || activeDate,
          rawTimestamp: i.created_at ? new Date(i.created_at).getTime() : parseUTCDate(activeDate),
          sourceModule: 'investment',
          sourceTransactionId: i.id,
          transactionType: isDrawing ? 'Owner Drawing' : i.transaction_type || 'Capital Withdrawal',
          customerOrAccountName: 'Owner / Investor',
          loanOrRefCode: isDrawing ? 'OWNER DRAWING' : 'WITHDRAWAL',
          description: i.remarks || 'Capital Withdrawn / Personal Drawing',
          cashIn: 0,
          cashOut: outAmt,
          collectorOrUser: 'Admin',
        });
      }
    });

    // Process Depositor Transactions
    dayDep.forEach((d: any) => {
      const inAmt = Number(d.amount_in || 0);
      const outAmt = Number(d.amount_out || 0);
      const depName = d.depositors?.name || 'Depositor';

      if (inAmt > 0) {
        rawEntries.push({
          id: `dep_in_${d.id}`,
          time: d.created_at ? new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '01:00 PM',
          date: d.transaction_date || activeDate,
          rawTimestamp: d.created_at ? new Date(d.created_at).getTime() : parseUTCDate(activeDate),
          sourceModule: 'depositor',
          sourceTransactionId: d.id,
          transactionType: 'Depositor Receipt',
          customerOrAccountName: depName,
          loanOrRefCode: 'DEPOSIT',
          description: d.remarks || `Deposit received from ${depName}`,
          cashIn: inAmt,
          cashOut: 0,
          collectorOrUser: 'Admin',
        });
      }

      if (outAmt > 0) {
        rawEntries.push({
          id: `dep_out_${d.id}`,
          time: d.created_at ? new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '05:00 PM',
          date: d.transaction_date || activeDate,
          rawTimestamp: d.created_at ? new Date(d.created_at).getTime() : parseUTCDate(activeDate),
          sourceModule: 'depositor',
          sourceTransactionId: d.id,
          transactionType: 'Depositor Payout',
          customerOrAccountName: depName,
          loanOrRefCode: 'DEPOSIT PAYOUT',
          description: d.remarks || `Deposit payout to ${depName}`,
          cashIn: 0,
          cashOut: outAmt,
          collectorOrUser: 'Admin',
        });
      }
    });

    // Process Stamp Expenses
    dayStamps.forEach((s: any) => {
      const amt = Number(s.amount || 0);
      if (amt <= 0) return;

      const custName = s.customers?.customer_name || 'Customer';
      rawEntries.push({
        id: `stamp_${s.id}`,
        time: s.created_at ? new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:30 AM',
        date: s.stamp_date || activeDate,
        rawTimestamp: s.created_at ? new Date(s.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: 'expense',
        sourceTransactionId: s.id,
        transactionType: `Stamp Expense (${s.stamp_type || 'Stamp'})`,
        customerOrAccountName: custName,
        loanOrRefCode: 'STAMP',
        description: s.remarks || `Stamp purchase for ${custName}`,
        cashIn: 0,
        cashOut: amt,
        collectorOrUser: 'Admin',
      });
    });

    // Process Employee Salaries
    daySalaries.forEach((s: any) => {
      const amt = Number(s.net_salary_paid || 0);
      if (amt <= 0) return;

      const empName = s.employees?.employee_name || 'Employee';
      rawEntries.push({
        id: `sal_${s.id}`,
        time: s.created_at ? new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '05:30 PM',
        date: s.payment_date || activeDate,
        rawTimestamp: s.created_at ? new Date(s.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: 'expense',
        sourceTransactionId: s.id,
        transactionType: `Salary Paid (${s.salary_month || ''})`,
        customerOrAccountName: empName,
        loanOrRefCode: 'SALARY',
        description: s.remarks || `Salary paid to ${empName}`,
        cashIn: 0,
        cashOut: amt,
        collectorOrUser: 'Admin',
      });
    });

    // Process Reversals
    dayReversals.forEach((r: any) => {
      const amt = Number(r.reversal_amount || 0);
      const isIn = r.reversal_type === 'cash_in';

      rawEntries.push({
        id: `rev_${r.id}`,
        time: r.created_at ? new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '06:00 PM',
        date: r.reversal_date || activeDate,
        rawTimestamp: r.created_at ? new Date(r.created_at).getTime() : parseUTCDate(activeDate),
        sourceModule: 'reversal',
        sourceTransactionId: r.source_transaction_id,
        transactionType: isIn ? 'Reversal Receipt (+)' : 'Reversal Deduction (-)',
        customerOrAccountName: 'Reversal Entry',
        loanOrRefCode: 'REVERSAL',
        description: `Reversal of #${r.source_transaction_id}: ${r.reason || 'Correction'}`,
        cashIn: isIn ? amt : 0,
        cashOut: !isIn ? amt : 0,
        collectorOrUser: r.created_by || 'Admin',
        isReversal: true,
        reversalOfId: r.source_transaction_id,
      });
    });

    // Sort entries chronologically
    rawEntries.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

    // Compute running balance for each entry
    let running = openingCash;
    let totalCashIn = 0;
    let totalCashOut = 0;

    const entries: DayBookEntry[] = rawEntries.map((e) => {
      totalCashIn += e.cashIn;
      totalCashOut += e.cashOut;
      running = Math.round((running + e.cashIn - e.cashOut) * 100) / 100;

      return {
        id: e.id,
        transactionTime: e.time,
        transactionDate: e.date,
        sourceModule: e.sourceModule,
        sourceTransactionId: e.sourceTransactionId,
        transactionType: e.transactionType,
        customerOrAccountName: e.customerOrAccountName,
        loanOrRefCode: e.loanOrRefCode,
        description: e.description,
        cashIn: e.cashIn,
        cashOut: e.cashOut,
        runningBalance: running,
        collectorOrUser: e.collectorOrUser,
        isReversal: e.isReversal,
        reversalOfId: e.reversalOfId,
      };
    });

    // Round summaries
    collectionSummary.dailyCollection = Math.round(collectionSummary.dailyCollection * 100) / 100;
    collectionSummary.weeklyCollection = Math.round(collectionSummary.weeklyCollection * 100) / 100;
    collectionSummary.monthlyInterest = Math.round(collectionSummary.monthlyInterest * 100) / 100;
    collectionSummary.monthlyPrincipal = Math.round(collectionSummary.monthlyPrincipal * 100) / 100;
    collectionSummary.emiCollection = Math.round(collectionSummary.emiCollection * 100) / 100;
    collectionSummary.otherCollection = Math.round(collectionSummary.otherCollection * 100) / 100;
    collectionSummary.totalCollection = Math.round(collectionSummary.totalCollection * 100) / 100;

    const expectedClosingCash = Math.round((openingCash + totalCashIn - totalCashOut) * 100) / 100;
    const actualPhysicalCash = dayClosure ? Number(dayClosure.actual_physical_cash) : undefined;
    const cashDifference = dayClosure ? Number(dayClosure.cash_difference) : undefined;

    const cashManagement: CashManagementSummary = {
      openingCash,
      totalCashIn: Math.round(totalCashIn * 100) / 100,
      totalCashOut: Math.round(totalCashOut * 100) / 100,
      expectedClosingCash,
      actualPhysicalCash,
      cashDifference,
      notes: dayClosure?.notes || undefined,
      isClosed: !!dayClosure,
    };

    return {
      success: true,
      data: {
        selectedDate: startDate,
        startDate,
        endDate,
        isDateRange,
        collectionSummary,
        cashManagement,
        entries,
      },
    };
  } catch (err: any) {
    console.error('getDayBookData error:', err);
    return { success: false, data: null, error: err.message || 'Failed to fetch Day Book data' };
  }
}

export async function saveDailyCashClosure(payload: {
  closureDate: string;
  actualPhysicalCash: number;
  notes?: string;
  closedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const dayDataRes = await getDayBookData(payload.closureDate);
    if (!dayDataRes.success || !dayDataRes.data) {
      return { success: false, error: 'Failed to calculate expected cash totals.' };
    }

    const { openingCash, totalCashIn, totalCashOut, expectedClosingCash } = dayDataRes.data.cashManagement;
    const actualPhysicalCash = Number(payload.actualPhysicalCash || 0);
    const cashDifference = Math.round((actualPhysicalCash - expectedClosingCash) * 100) / 100;

    const dataPayload = {
      closure_date: payload.closureDate,
      opening_cash: openingCash,
      total_cash_in: totalCashIn,
      total_cash_out: totalCashOut,
      expected_closing_cash: expectedClosingCash,
      actual_physical_cash: actualPhysicalCash,
      cash_difference: cashDifference,
      notes: payload.notes || null,
      closed_by: payload.closedBy || 'Admin',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('daily_cash_closures')
      .select('id')
      .eq('closure_date', payload.closureDate)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('daily_cash_closures')
        .update(dataPayload)
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('daily_cash_closures').insert([dataPayload]);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save cash closure' };
  }
}

export async function recordTransactionReversal(payload: {
  sourceModule: string;
  sourceTransactionId: string;
  reversalType: 'cash_in' | 'cash_out';
  reversalAmount: number;
  reason: string;
  createdBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];

    const dataPayload = {
      source_module: payload.sourceModule,
      source_transaction_id: payload.sourceTransactionId,
      reversal_type: payload.reversalType,
      reversal_date: todayISO,
      reversal_amount: Number(payload.reversalAmount),
      reason: payload.reason,
      created_by: payload.createdBy || 'Admin',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('transaction_reversals').insert([dataPayload]);
    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record transaction reversal' };
  }
}

export async function deleteDailyCashClosure(closureDate: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('daily_cash_closures')
      .delete()
      .eq('closure_date', closureDate);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete daily cash closure' };
  }
}
