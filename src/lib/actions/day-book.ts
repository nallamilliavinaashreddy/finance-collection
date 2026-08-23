import { createClient } from '@/lib/supabase/client';
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

export async function getDayBookData(dateISO?: string): Promise<{
  success: boolean;
  data: DayBookData | null;
  error?: string;
}> {
  const supabase = createClient();
  const selectedDate = dateISO || new Date().toISOString().split('T')[0];

  try {
    // 1. Calculate Opening Cash (All cash transactions strictly before selectedDate)
    const [
      { data: prevCols },
      { data: prevLoans },
      { data: prevExp },
      { data: prevInvest },
      { data: prevDep },
      { data: prevStamps },
      { data: prevSalaries },
      { data: prevReversals },
    ] = await Promise.all([
      supabase.from('collections').select('amount, payment_date').lt('payment_date', selectedDate),
      supabase.from('loans').select('amount_given, start_date, created_at').or(`start_date.lt.${selectedDate},created_at.lt.${selectedDate}`),
      supabase.from('expenses').select('amount, expense_date').lt('expense_date', selectedDate),
      supabase
        .from('investment_transactions')
        .select('amount_in, amount_out, transaction_date, reference_type, transaction_type')
        .lt('transaction_date', selectedDate),
      supabase.from('depositor_transactions').select('amount_in, amount_out, transaction_date').lt('transaction_date', selectedDate),
      supabase.from('stamps').select('amount_in, amount_out, transaction_date').lt('transaction_date', selectedDate),
      supabase.from('employee_transactions').select('amount, payment_date').lt('payment_date', selectedDate),
      supabase.from('transaction_reversals').select('reversal_amount, reversal_type, reversal_date').lt('reversal_date', selectedDate),
    ]);

    let openingCash = 0;

    // Add historical Inflows
    (prevCols || []).forEach((c: any) => (openingCash += Number(c.amount || 0)));
    (prevInvest || []).forEach((i: any) => {
      if (i.reference_type !== 'yearly_interest' && i.transaction_type !== 'Annual Interest') {
        openingCash += Number(i.amount_in || 0);
      }
    });
    (prevDep || []).forEach((d: any) => (openingCash += Number(d.amount_in || 0)));
    (prevStamps || []).forEach((s: any) => (openingCash += Number(s.amount_in || 0)));

    // Subtract historical Outflows
    (prevLoans || []).forEach((l: any) => (openingCash -= Number(l.amount_given || 0)));
    (prevExp || []).forEach((e: any) => (openingCash -= Number(e.amount || 0)));
    (prevInvest || []).forEach((i: any) => {
      if (i.reference_type !== 'yearly_interest' && i.transaction_type !== 'Annual Interest') {
        openingCash -= Number(i.amount_out || 0);
      }
    });
    (prevDep || []).forEach((d: any) => (openingCash -= Number(d.amount_out || 0)));
    (prevStamps || []).forEach((s: any) => (openingCash -= Number(s.amount_out || 0)));
    (prevSalaries || []).forEach((s: any) => (openingCash -= Number(s.amount || 0)));

    // Reversals impact
    (prevReversals || []).forEach((r: any) => {
      if (r.reversal_type === 'cash_in') openingCash += Number(r.reversal_amount || 0);
      else if (r.reversal_type === 'cash_out') openingCash -= Number(r.reversal_amount || 0);
    });

    openingCash = Math.round(openingCash * 100) / 100;

    // 2. Fetch Day's Transactions for selectedDate
    const [
      { data: dayCols },
      { data: dayLoans },
      { data: dayExp },
      { data: dayInvest },
      { data: dayDep },
      { data: dayStamps },
      { data: daySalaries },
      { data: dayReversals },
      { data: dayClosure },
    ] = await Promise.all([
      supabase
        .from('collections')
        .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
        .eq('payment_date', selectedDate),
      supabase
        .from('loans')
        .select('*, customers(id, customer_id, customer_name, mobile_number)')
        .or(`start_date.eq.${selectedDate},created_at.gte.${selectedDate}T00:00:00,created_at.lte.${selectedDate}T23:59:59`),
      supabase.from('expenses').select('*').eq('expense_date', selectedDate),
      supabase
        .from('investment_transactions')
        .select('*')
        .eq('transaction_date', selectedDate),
      supabase
        .from('depositor_transactions')
        .select('*, depositors(depositor_name)')
        .eq('transaction_date', selectedDate),
      supabase.from('stamps').select('*').eq('transaction_date', selectedDate),
      supabase.from('employee_transactions').select('*, employees(employee_name)').eq('payment_date', selectedDate),
      supabase.from('transaction_reversals').select('*').eq('reversal_date', selectedDate),
      supabase.from('daily_cash_closures').select('*').eq('closure_date', selectedDate).maybeSingle(),
    ]);

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
    (dayCols || []).forEach((c: any) => {
      const amt = Number(c.amount || 0);
      if (amt <= 0) return;

      const loan = c.loans || {};
      const cust = loan.customers || {};
      const loanType = (loan.loan_type || loan.loanType || '').toLowerCase();

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
        if (c.payment_type === 'interest' || c.remarks?.includes('Interest')) {
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
        date: c.payment_date || selectedDate,
        rawTimestamp: c.created_at ? new Date(c.created_at).getTime() : parseUTCDate(selectedDate),
        sourceModule: sourceMod,
        sourceTransactionId: c.id,
        transactionType: typeLabel,
        customerOrAccountName: cust.customer_name || 'Customer',
        loanOrRefCode: loan.loan_id || loan.loan_code || 'LOAN',
        description: c.remarks || `${typeLabel} received`,
        cashIn: amt,
        cashOut: 0,
        collectorOrUser: c.collector_name || 'Admin',
      });
    });

    // Process Loan Disbursements
    (dayLoans || []).forEach((l: any) => {
      const amt = Number(l.amount_given || 0);
      if (amt <= 0) return;

      const cust = l.customers || {};
      const lType = (l.loan_type || '').toLowerCase();

      rawEntries.push({
        id: `loan_${l.id}`,
        time: l.created_at ? new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '11:00 AM',
        date: l.start_date || selectedDate,
        rawTimestamp: l.created_at ? new Date(l.created_at).getTime() : parseUTCDate(selectedDate),
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
    (dayExp || []).forEach((e: any) => {
      const amt = Number(e.amount || 0);
      if (amt <= 0) return;

      rawEntries.push({
        id: `exp_${e.id}`,
        time: e.created_at ? new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '02:00 PM',
        date: e.expense_date || selectedDate,
        rawTimestamp: e.created_at ? new Date(e.created_at).getTime() : parseUTCDate(selectedDate),
        sourceModule: 'expense',
        sourceTransactionId: e.id,
        transactionType: `Office Expense (${e.category || 'General'})`,
        customerOrAccountName: e.category || 'Office Expense',
        loanOrRefCode: 'EXPENSE',
        description: e.remarks || e.title || 'Office Expense',
        cashIn: 0,
        cashOut: amt,
        collectorOrUser: e.created_by || 'Admin',
      });
    });

    // Process Investment & Owner Transactions
    (dayInvest || []).forEach((i: any) => {
      if (i.reference_type === 'yearly_interest' || i.transaction_type === 'Annual Interest') return;

      const inAmt = Number(i.amount_in || 0);
      const outAmt = Number(i.amount_out || 0);

      if (inAmt > 0) {
        collectionSummary.otherCollection += inAmt;
        collectionSummary.totalCollection += inAmt;

        rawEntries.push({
          id: `inv_in_${i.id}`,
          time: i.created_at ? new Date(i.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '03:00 PM',
          date: i.transaction_date || selectedDate,
          rawTimestamp: i.created_at ? new Date(i.created_at).getTime() : parseUTCDate(selectedDate),
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
          date: i.transaction_date || selectedDate,
          rawTimestamp: i.created_at ? new Date(i.created_at).getTime() : parseUTCDate(selectedDate),
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
    (dayDep || []).forEach((d: any) => {
      const inAmt = Number(d.amount_in || 0);
      const outAmt = Number(d.amount_out || 0);
      const depName = d.depositors?.depositor_name || 'Depositor';

      if (inAmt > 0) {
        collectionSummary.otherCollection += inAmt;
        collectionSummary.totalCollection += inAmt;

        rawEntries.push({
          id: `dep_in_${d.id}`,
          time: d.created_at ? new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '01:00 PM',
          date: d.transaction_date || selectedDate,
          rawTimestamp: d.created_at ? new Date(d.created_at).getTime() : parseUTCDate(selectedDate),
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
          date: d.transaction_date || selectedDate,
          rawTimestamp: d.created_at ? new Date(d.created_at).getTime() : parseUTCDate(selectedDate),
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

    // Process Reversals
    (dayReversals || []).forEach((r: any) => {
      const amt = Number(r.reversal_amount || 0);
      const isIn = r.reversal_type === 'cash_in';

      rawEntries.push({
        id: `rev_${r.id}`,
        time: r.created_at ? new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '06:00 PM',
        date: r.reversal_date || selectedDate,
        rawTimestamp: r.created_at ? new Date(r.created_at).getTime() : parseUTCDate(selectedDate),
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
        selectedDate,
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
