import { createClient } from '@/lib/supabase/client';
import { Loan, Collection, AdjustmentLedgerItem, LoanType } from '@/types';
import { decodeLoanType, decodeTotalWeeks, decodeTotalMonths } from '@/lib/actions/loans';
import { getMonthDateRange } from '@/lib/utils';
import { getInvestmentTransactions, getInvestmentMetrics } from '@/lib/actions/investment';

export interface OverallSummary {
  totalCustomers: number;
  activeLoansCount: number;
  activeInvestment: number;
  totalInterest: number; // Overall Target - Overall Given
  remainingBalance: number;
  todaysCollections: number;
  todaysExpenses: number;
  thisMonthsExpenses: number;
  todaysStampCost: number;
  thisMonthsStampCost: number;
  todaysChitPayments: number;
  thisMonthsChitPayments: number;
}

export interface ProfitAndLossMetrics {
  totalInvestment: number;
  loanInterest: number;
  investmentInterest: number;
  totalExpenses: number;
  netProfit: number;
}

export interface TypeSectionMetrics {
  activeLoansCount: number;
  totalLoansCount: number;
  investment: number; // SUM(amount_given) WHERE is_closed = false
  interest: number; // Total Target - Total Given
  recentCollections: Collection[];
  activeLoans: Loan[];
}

export interface AdjustmentSectionMetrics {
  activeLoansCount: number;
  totalLoansCount: number;
  investment: number; // SUM(amount_given) WHERE is_closed = false
  outstandingBalance: number;
  recentLedgerTransactions: AdjustmentLedgerItem[];
  activeLoans: Loan[];
}

export interface CategorizedDashboardData {
  overallSummary: OverallSummary;
  profitLoss: ProfitAndLossMetrics;
  dailySection: TypeSectionMetrics;
  weeklySection: TypeSectionMetrics;
  monthlySection: TypeSectionMetrics;
  adjustmentSection: AdjustmentSectionMetrics;
}

export async function getDashboardData(): Promise<{
  success: boolean;
  data: CategorizedDashboardData | null;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];
    const { monthStart, monthEnd } = getMonthDateRange(todayISO);

    // Query 1: Total Customers Count
    const { count: totalCustomersCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });

    // Query 2: All Loans with joined customers
    const { data: rawLoans } = await supabase
      .from('loans')
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .order('created_at', { ascending: false });

    // Query 3: All Collections with joined loans & customers
    const { data: rawCollections } = await supabase
      .from('collections')
      .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Query 4: Adjustment Ledger Records
    let rawLedger: any[] = [];
    try {
      const { data: lData, error: lErr } = await supabase
        .from('adjustment_ledger')
        .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!lErr && lData) {
        rawLedger = lData;
      }
    } catch (lException) {
      console.warn('Notice: adjustment_ledger query skipped (table not in schema cache).');
    }

    // Query 5: Expenses Records
    let todaysExpenses = 0;
    let thisMonthsExpenses = 0;
    let totalExpensesSum = 0;
    try {
      const { data: expData, error: expErr } = await supabase.from('expenses').select('*');
      if (!expErr && expData) {
        todaysExpenses = expData
          .filter((e: any) => e.expense_date === todayISO)
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        thisMonthsExpenses = expData
          .filter((e: any) => e.expense_date >= monthStart && e.expense_date <= monthEnd)
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        totalExpensesSum = expData.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      }
    } catch (expEx) {
      console.warn('Notice: expenses query skipped (table not in schema cache).');
    }

    // Query 6: Stamps Records
    let todaysStampCost = 0;
    let thisMonthsStampCost = 0;
    try {
      const { data: stampData, error: stampErr } = await supabase.from('stamps').select('*');
      if (!stampErr && stampData) {
        todaysStampCost = stampData
          .filter((s: any) => s.stamp_date === todayISO)
          .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);

        thisMonthsStampCost = stampData
          .filter((s: any) => s.stamp_date >= monthStart && s.stamp_date <= monthEnd)
          .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
      }
    } catch (stampEx) {
      console.warn('Notice: stamps query skipped (table not in schema cache).');
    }

    // Query 7: Chit Payments Records
    let todaysChitPayments = 0;
    let thisMonthsChitPayments = 0;
    try {
      const { data: chitPayData, error: chitPayErr } = await supabase.from('chit_payments').select('*');
      if (!chitPayErr && chitPayData) {
        todaysChitPayments = chitPayData
          .filter((p: any) => p.payment_date === todayISO)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

        thisMonthsChitPayments = chitPayData
          .filter((p: any) => p.payment_date >= monthStart && p.payment_date <= monthEnd)
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      }
    } catch (chitEx) {
      console.warn('Notice: chit_payments query skipped (table not in schema cache).');
    }

    // Query 8: Investment Khata Data for P&L and Summary
    let totalInvestmentCapital = 0;
    let investmentInterestCost = 0;
    try {
      const metRes = await getInvestmentMetrics();
      if (metRes.success && metRes.data) {
        totalInvestmentCapital = metRes.data.ownerCapital > 0 ? metRes.data.ownerCapital : metRes.data.currentBalance;
        investmentInterestCost = metRes.data.investmentInterest;
      }
    } catch (invEx) {
      console.warn('Notice: investment_transactions query skipped:', invEx);
    }

    // Format all loans into structured Loan objects
    const allFormattedLoans: Loan[] = (rawLoans || []).map((item: any) => {
      const cust = item.customers || {};
      const collected = Number(item.collected_amount || 0);
      const totalTarget = Number(item.total_collection || item.total_collection_amount || 0);
      const balance = item.balance_amount !== undefined && item.balance_amount !== null
        ? Number(item.balance_amount)
        : Math.max(0, totalTarget - collected);

      const isClosedVal = item.is_closed !== undefined && item.is_closed !== null
        ? Boolean(item.is_closed)
        : balance <= 0;

      const lType: LoanType = decodeLoanType(item.working_days, item.loan_type);
      const totalWks = decodeTotalWeeks(item.working_days, item.total_weeks);
      const totalMths = decodeTotalMonths(item.working_days, item.total_months);
      const daysCount = lType === 'daily' ? Number(item.working_days || 100) : 100;

      return {
        id: item.id,
        customerId: item.customer_id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        mobileNumber: cust.mobile_number,
        loanType: lType,
        city: item.city || undefined,
        amountGiven: Number(item.amount_given || 0),
        totalCollectionAmount: totalTarget,
        interestRate: item.monthly_interest_rate !== undefined && item.monthly_interest_rate !== null
          ? Number(item.monthly_interest_rate)
          : (item.interest_rate !== undefined ? Number(item.interest_rate) : 0),
        workingDays: daysCount,
        totalWeeks: totalWks,
        totalMonths: totalMths,
        dailyAmount: item.daily_amount ? Number(item.daily_amount) : Math.round((totalTarget / daysCount) * 100) / 100,
        weeklyAmount: item.weekly_amount ? Number(item.weekly_amount) : Math.round((totalTarget / Math.max(1, totalWks)) * 100) / 100,
        monthlyAmount: item.monthly_amount ? Number(item.monthly_amount) : Math.round((totalTarget / Math.max(1, totalMths)) * 100) / 100,
        collectedAmount: collected,
        balanceAmount: balance,
        isClosed: isClosedVal,
        startDate: item.start_date,
        endDate: item.end_date,
        status: isClosedVal ? 'closed' : 'active',
        createdAt: item.created_at,
      };
    });

    // Format all collections into structured Collection objects
    const allFormattedCollections: (Collection & { loanType: LoanType })[] = (rawCollections || []).map((item: any) => {
      const loan = item.loans || {};
      const cust = loan.customers || {};
      const lType = decodeLoanType(loan.working_days, loan.loan_type);

      return {
        id: item.id,
        loanId: item.loan_id,
        customerId: loan.customer_id || '',
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        amountPaid: Number(item.amount_paid || 0),
        paymentDate: item.payment_date,
        remarks: item.remarks || undefined,
        remainingBalanceAfterPayment: Number(item.remaining_balance_after_payment || loan.balance_amount || 0),
        loanType: lType,
        createdAt: item.created_at,
      };
    });

    // Format adjustment ledger items
    const allLedgerItems: AdjustmentLedgerItem[] = (rawLedger || []).map((item: any) => ({
      id: item.id,
      loanId: item.loan_id,
      transactionDate: item.transaction_date,
      transactionType: (item.transaction_type as any) || 'payment',
      openingBalance: Number(item.opening_balance || 0),
      interestRate: Number(item.monthly_interest_rate ?? item.interest_rate ?? 0),
      interestAdded: Number(item.interest_added || 0),
      paymentReceived: Number(item.payment_received || 0),
      closingBalance: Number(item.closing_balance || 0),
      remarks: item.remarks || undefined,
      createdAt: item.created_at,
    }));

    // 1. OVERALL SUMMARY
    const activeLoansList = allFormattedLoans.filter((l) => !l.isClosed);
    const activeLoansInvestment = activeLoansList.reduce((sum, l) => sum + l.amountGiven, 0);
    // Active Investment = Owner Capital from Investment Khata if available (> 0), else active loans principal
    const activeInvestment = totalInvestmentCapital > 0 ? totalInvestmentCapital : activeLoansInvestment;

    const overallTotalGiven = allFormattedLoans.reduce((sum, l) => sum + l.amountGiven, 0);
    const overallTotalTarget = allFormattedLoans.reduce((sum, l) => sum + l.totalCollectionAmount, 0);
    const overallTotalCollected = allFormattedLoans.reduce((sum, l) => sum + l.collectedAmount, 0);
    const overallRemaining = Math.max(0, overallTotalTarget - overallTotalCollected);
    const overallTodaysColl = allFormattedCollections
      .filter((c) => c.paymentDate === todayISO)
      .reduce((sum, c) => sum + c.amountPaid, 0);

    const totalInterest = Math.max(0, overallTotalTarget - overallTotalGiven);

    const overallSummary: OverallSummary = {
      totalCustomers: totalCustomersCount || 0,
      activeLoansCount: activeLoansList.length,
      activeInvestment,
      totalInterest,
      remainingBalance: overallRemaining,
      todaysCollections: overallTodaysColl,
      todaysExpenses,
      thisMonthsExpenses,
      todaysStampCost,
      thisMonthsStampCost,
      todaysChitPayments,
      thisMonthsChitPayments,
    };

    // 2. PROFIT & LOSS CALCULATIONS
    // Formula: Net Profit = Loan Interest - Investment Interest - Expenses
    // Loan Interest: Total interest earned from active loans
    const loanInterest = activeLoansList.reduce(
      (sum, l) => sum + Math.max(0, l.totalCollectionAmount - l.amountGiven),
      0
    );

    // Investment Interest: Total daily simple interest cost on owner's capital
    const investmentInterest = investmentInterestCost;

    // Expenses: Total operational expenses (Stamps and Chits are excluded)
    const totalExpenses = totalExpensesSum;

    // Net Profit / Loss
    const netProfit = Math.round((loanInterest - investmentInterest - totalExpenses) * 100) / 100;

    const profitLoss: ProfitAndLossMetrics = {
      totalInvestment: totalInvestmentCapital > 0 ? totalInvestmentCapital : activeLoansInvestment,
      loanInterest: Math.round(loanInterest * 100) / 100,
      investmentInterest: Math.round(investmentInterest * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
    };

    // Helper to compute type section metrics (Daily, Weekly, Monthly)
    const computeTypeSection = (type: LoanType): TypeSectionMetrics => {
      const typeLoans = allFormattedLoans.filter((l) => l.loanType === type);
      const activeLoans = typeLoans.filter((l) => !l.isClosed);
      const investment = activeLoans.reduce((sum, l) => sum + l.amountGiven, 0);

      const given = typeLoans.reduce((sum, l) => sum + l.amountGiven, 0);
      const target = typeLoans.reduce((sum, l) => sum + l.totalCollectionAmount, 0);
      const interest = Math.max(0, target - given);

      const typeColls = allFormattedCollections.filter((c) => c.loanType === type);

      return {
        activeLoansCount: activeLoans.length,
        totalLoansCount: typeLoans.length,
        investment,
        interest,
        recentCollections: typeColls.slice(0, 5),
        activeLoans: activeLoans.slice(0, 5),
      };
    };

    const dailySection = computeTypeSection('daily');
    const weeklySection = computeTypeSection('weekly');
    const monthlySection = computeTypeSection('monthly');

    // ADJUSTMENT LOANS SECTION
    const adjLoans = allFormattedLoans.filter((l) => l.loanType === 'adjustment');
    const activeAdjLoans = adjLoans.filter((l) => !l.isClosed);
    const adjInvestment = activeAdjLoans.reduce((sum, l) => sum + l.amountGiven, 0);
    const outstandingBalance = activeAdjLoans.reduce((sum, l) => sum + l.balanceAmount, 0);

    const adjustmentSection: AdjustmentSectionMetrics = {
      activeLoansCount: activeAdjLoans.length,
      totalLoansCount: adjLoans.length,
      investment: adjInvestment,
      outstandingBalance,
      recentLedgerTransactions: allLedgerItems.slice(0, 5),
      activeLoans: activeAdjLoans.slice(0, 5),
    };

    return {
      success: true,
      data: {
        overallSummary,
        profitLoss,
        dailySection,
        weeklySection,
        monthlySection,
        adjustmentSection,
      },
    };
  } catch (err: any) {
    console.error('Unexpected error in getDashboardData:', err);
    return { success: false, data: null, error: err?.message || 'Failed to query dashboard datasets' };
  }
}
