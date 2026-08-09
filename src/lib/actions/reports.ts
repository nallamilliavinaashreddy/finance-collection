import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { decodeLoanType, decodeTotalWeeks, decodeTotalMonths } from '@/lib/actions/loans';
import { getInvestmentMetrics, getInvestmentTransactions } from '@/lib/actions/investment';
import { getInterestMetrics, getInterestTransactions } from '@/lib/actions/interest';
import { InterestReportData } from '@/types';

export type TimeFilterType = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export interface CustomerReportItem {
  id: string;
  customerCode: string;
  customerName: string;
  mobileNumber: string;
  loanAmount: number;
  totalTarget: number;
  collectedAmount: number;
  remainingBalance: number;
  loanStatus: string;
  loanType: string;
}

export interface CollectionReportItem {
  id: string;
  paymentDate: string;
  customerCode: string;
  customerName: string;
  amountPaid: number;
  remainingBalanceAfterPayment: number;
  remarks: string;
}

export interface LoanReportItem {
  id: string;
  customerCode: string;
  customerName: string;
  loanType: string;
  city?: string;
  amountGiven: number;
  targetAmount: number;
  dailyAmount: number;
  weeklyAmount: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  remainingBalance: number;
  status: string;
}

export interface ExpenseReportItem {
  id: string;
  expenseDate: string;
  category: string;
  amount: number;
  description: string;
  paidTo?: string;
  paymentMode: string;
  remarks?: string;
}

export interface ExpenseCategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ExpenseReportData {
  totalExpenses: number;
  totalExpenseCount: number;
  categorySummaries: ExpenseCategorySummary[];
  monthlyExpenseTrend: { month: string; amount: number }[];
  expenseReports: ExpenseReportItem[];
}

export interface StampReportItem {
  id: string;
  stampDate: string;
  customerCode: string;
  customerName: string;
  stampType: string;
  stampNumber?: string;
  amount: number;
  vendor?: string;
  remarks?: string;
}

export interface CustomerStampSummary {
  customerCode: string;
  customerName: string;
  stampCount: number;
  totalIncome: number;
  percentage: number;
}

export interface StampReportData {
  totalStampIncome: number;
  totalStampCount: number;
  customerStampSummaries: CustomerStampSummary[];
  monthlyStampTrend: { month: string; amount: number }[];
  stampReports: StampReportItem[];
}

export interface ChitPaymentReportItem {
  id: string;
  paymentDate: string;
  chitCompany: string;
  groupNumber: string;
  amount: number;
  receiptNumber?: string;
  paymentMode: string;
  remarks?: string;
}

export interface CompanyChitSummary {
  chitCompany: string;
  subscriptionsCount: number;
  totalPoolValue: number;
  totalPaid: number;
  percentage: number;
}

export interface ChitReportData {
  totalChitValue: number;
  totalPaidAmount: number;
  totalPaymentsCount: number;
  companySummaries: CompanyChitSummary[];
  monthlyChitTrend: { month: string; amount: number }[];
  chitPaymentReports: ChitPaymentReportItem[];
}

export interface ReportsSummaryMetrics {
  totalCustomers: number;
  totalActiveLoans: number;
  totalClosedLoans: number;
  totalAmountGiven: number;
  totalCollectionTarget: number;
  totalAmountCollected: number;
  totalRemainingBalance: number;
  recoveryPercentage: number;
}

export interface InvestmentReportData {
  currentBalance: number;
  investmentInterest: number;
  loanInterest: number;
  expenses: number;
  netProfit: number;
  monthlyInterestRate: number;
  cashFlowReports: any[];
}

export interface ReportsData {
  summary: ReportsSummaryMetrics;
  customerReports: CustomerReportItem[];
  collectionReports: CollectionReportItem[];
  loanReports: LoanReportItem[];
  monthlyTrendData: { month: string; collected: number }[];
  dailyTrendData: { date: string; collected: number }[];
  loanStatusPieData: { name: string; value: number; color: string }[];
  expenseReportData: ExpenseReportData;
  stampReportData: StampReportData;
  chitReportData: ChitReportData;
  investmentReportData?: InvestmentReportData;
  interestReportData?: InterestReportData;
}

export async function getReportsData(
  timeFilter: TimeFilterType = 'all',
  customStartDate?: string,
  customEndDate?: string,
  searchQuery: string = ''
): Promise<{ success: boolean; data: ReportsData | null; error?: string }> {
  const supabase = createClient();

  try {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    // Build Date Filter Clauses for Collections
    let filterStart: string | null = null;
    let filterEnd: string | null = null;

    if (timeFilter === 'today') {
      filterStart = todayISO;
      filterEnd = todayISO;
    } else if (timeFilter === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yISO = y.toISOString().split('T')[0];
      filterStart = yISO;
      filterEnd = yISO;
    } else if (timeFilter === 'this_week') {
      const day = today.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const mon = new Date(today);
      mon.setDate(today.getDate() + diffToMon);
      filterStart = mon.toISOString().split('T')[0];
      filterEnd = todayISO;
    } else if (timeFilter === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      filterStart = first.toISOString().split('T')[0];
      filterEnd = todayISO;
    } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
      filterStart = customStartDate;
      filterEnd = customEndDate;
    }

    // Query Customers
    const { data: customersData } = await supabase.from('customers').select('*');

    // Query Loans
    const { data: rawLoans } = await supabase
      .from('loans')
      .select('*, customers(id, customer_id, customer_name, mobile_number)');

    // Query Collections
    let collQuery = supabase
      .from('collections')
      .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
      .order('payment_date', { ascending: false });

    if (filterStart) collQuery = collQuery.gte('payment_date', filterStart);
    if (filterEnd) collQuery = collQuery.lte('payment_date', filterEnd);

    const { data: rawCollections } = await collQuery;

    // Query Expenses
    let expQuery = supabase.from('expenses').select('*').order('expense_date', { ascending: false });

    if (filterStart) expQuery = expQuery.gte('expense_date', filterStart);
    if (filterEnd) expQuery = expQuery.lte('expense_date', filterEnd);

    let rawExpenses: any[] = [];
    try {
      const { data: expData, error: expErr } = await expQuery;
      if (!expErr && expData) {
        rawExpenses = expData;
      }
    } catch (e) {
      console.warn('Notice: expenses table query skipped in reports.');
    }

    // Query Stamps
    let stampQuery = supabase
      .from('stamps')
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .order('stamp_date', { ascending: false });

    if (filterStart) stampQuery = stampQuery.gte('stamp_date', filterStart);
    if (filterEnd) stampQuery = stampQuery.lte('stamp_date', filterEnd);

    let rawStamps: any[] = [];
    try {
      const { data: stData, error: stErr } = await stampQuery;
      if (!stErr && stData) {
        rawStamps = stData;
      }
    } catch (e) {
      console.warn('Notice: stamps table query skipped in reports.');
    }

    // Query Chits & Chit Payments
    const { data: rawChits } = await supabase.from('chits').select('*');

    let chitPayQuery = supabase
      .from('chit_payments')
      .select('*, chits(id, chit_company, group_number)')
      .order('payment_date', { ascending: false });

    if (filterStart) chitPayQuery = chitPayQuery.gte('payment_date', filterStart);
    if (filterEnd) chitPayQuery = chitPayQuery.lte('payment_date', filterEnd);

    let rawChitPayments: any[] = [];
    try {
      const { data: cpData, error: cpErr } = await chitPayQuery;
      if (!cpErr && cpData) {
        rawChitPayments = cpData;
      }
    } catch (e) {
      console.warn('Notice: chit_payments table query skipped in reports.');
    }

    // Process Expenses Report Data
    const formattedExpenses: ExpenseReportItem[] = rawExpenses.map((e: any) => ({
      id: e.id,
      expenseDate: e.expense_date,
      category: e.category,
      amount: Number(e.amount || 0),
      description: e.description,
      paidTo: e.paid_to || undefined,
      paymentMode: e.payment_mode || 'Cash',
      remarks: e.remarks || undefined,
    }));

    let filteredExpenses = formattedExpenses;
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filteredExpenses = filteredExpenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q)
      );
    }

    const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryMap = new Map<string, { amount: number; count: number }>();
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Misc';
      const existing = categoryMap.get(cat) || { amount: 0, count: 0 };
      categoryMap.set(cat, {
        amount: existing.amount + e.amount,
        count: existing.count + 1,
      });
    });

    const categorySummaries: ExpenseCategorySummary[] = Array.from(categoryMap.entries()).map(([cat, val]) => ({
      category: cat,
      amount: val.amount,
      percentage: totalExpensesAmount > 0 ? Math.round((val.amount / totalExpensesAmount) * 100) : 0,
      count: val.count,
    })).sort((a, b) => b.amount - a.amount);

    const monthlyExpenseMap = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const date = new Date(e.expenseDate);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyExpenseMap.set(monthKey, (monthlyExpenseMap.get(monthKey) || 0) + e.amount);
      }
    });

    const monthlyExpenseTrend = Array.from(monthlyExpenseMap.entries()).map(([m, amt]) => ({
      month: m,
      amount: amt,
    }));

    const expenseReportData: ExpenseReportData = {
      totalExpenses: totalExpensesAmount,
      totalExpenseCount: filteredExpenses.length,
      categorySummaries,
      monthlyExpenseTrend,
      expenseReports: filteredExpenses,
    };

    // Process Stamps Report Data
    const formattedStamps: StampReportItem[] = rawStamps.map((s: any) => {
      const cust = s.customers || {};
      return {
        id: s.id,
        stampDate: s.stamp_date,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        stampType: s.stamp_type,
        stampNumber: s.stamp_number || undefined,
        amount: Number(s.amount || 0),
        vendor: s.vendor || undefined,
        remarks: s.remarks || undefined,
      };
    });

    let filteredStamps = formattedStamps;
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filteredStamps = filteredStamps.filter(
        (s) =>
          s.customerCode.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.stampType.toLowerCase().includes(q) ||
          (s.stampNumber && s.stampNumber.toLowerCase().includes(q)) ||
          (s.vendor && s.vendor.toLowerCase().includes(q))
      );
    }

    const totalStampIncome = filteredStamps.reduce((sum, s) => sum + s.amount, 0);

    const custStampMap = new Map<string, { name: string; income: number; count: number }>();
    filteredStamps.forEach((s) => {
      const code = s.customerCode || 'N/A';
      const existing = custStampMap.get(code) || { name: s.customerName, income: 0, count: 0 };
      custStampMap.set(code, {
        name: s.customerName,
        income: existing.income + s.amount,
        count: existing.count + 1,
      });
    });

    const customerStampSummaries: CustomerStampSummary[] = Array.from(custStampMap.entries())
      .map(([code, val]) => ({
        customerCode: code,
        customerName: val.name,
        stampCount: val.count,
        totalIncome: val.income,
        percentage: totalStampIncome > 0 ? Math.round((val.income / totalStampIncome) * 100) : 0,
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome);

    const monthlyStampMap = new Map<string, number>();
    filteredStamps.forEach((s) => {
      const date = new Date(s.stampDate);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyStampMap.set(monthKey, (monthlyStampMap.get(monthKey) || 0) + s.amount);
      }
    });

    const monthlyStampTrend = Array.from(monthlyStampMap.entries()).map(([m, amt]) => ({
      month: m,
      amount: amt,
    }));

    const stampReportData: StampReportData = {
      totalStampIncome,
      totalStampCount: filteredStamps.length,
      customerStampSummaries,
      monthlyStampTrend,
      stampReports: filteredStamps,
    };

    // Process Chits Report Data
    const formattedChitPayments: ChitPaymentReportItem[] = rawChitPayments.map((cp: any) => {
      const c = cp.chits || {};
      return {
        id: cp.id,
        paymentDate: cp.payment_date,
        chitCompany: c.chit_company || 'N/A',
        groupNumber: c.group_number || 'N/A',
        amount: Number(cp.amount || 0),
        receiptNumber: cp.receipt_number || undefined,
        paymentMode: cp.payment_mode || 'Bank Transfer',
        remarks: cp.remarks || undefined,
      };
    });

    let filteredChitPayments = formattedChitPayments;
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filteredChitPayments = filteredChitPayments.filter(
        (cp) =>
          cp.chitCompany.toLowerCase().includes(q) ||
          cp.groupNumber.toLowerCase().includes(q) ||
          (cp.receiptNumber && cp.receiptNumber.toLowerCase().includes(q))
      );
    }

    const totalChitValue = (rawChits || []).reduce((sum: number, c: any) => sum + Number(c.chit_value || 0), 0);
    const totalPaidAmount = filteredChitPayments.reduce((sum, cp) => sum + cp.amount, 0);

    const companyMap = new Map<string, { pool: number; paid: number; count: number }>();
    (rawChits || []).forEach((c: any) => {
      const comp = c.chit_company || 'Other';
      const existing = companyMap.get(comp) || { pool: 0, paid: 0, count: 0 };
      companyMap.set(comp, {
        pool: existing.pool + Number(c.chit_value || 0),
        paid: existing.paid + Number(c.total_paid || 0),
        count: existing.count + 1,
      });
    });

    const companySummaries: CompanyChitSummary[] = Array.from(companyMap.entries()).map(([comp, val]) => ({
      chitCompany: comp,
      subscriptionsCount: val.count,
      totalPoolValue: val.pool,
      totalPaid: val.paid,
      percentage: totalChitValue > 0 ? Math.round((val.pool / totalChitValue) * 100) : 0,
    })).sort((a, b) => b.totalPoolValue - a.totalPoolValue);

    const monthlyChitMap = new Map<string, number>();
    filteredChitPayments.forEach((cp) => {
      const date = new Date(cp.paymentDate);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyChitMap.set(monthKey, (monthlyChitMap.get(monthKey) || 0) + cp.amount);
      }
    });

    const monthlyChitTrend = Array.from(monthlyChitMap.entries()).map(([m, amt]) => ({
      month: m,
      amount: amt,
    }));

    const chitReportData: ChitReportData = {
      totalChitValue,
      totalPaidAmount,
      totalPaymentsCount: filteredChitPayments.length,
      companySummaries,
      monthlyChitTrend,
      chitPaymentReports: filteredChitPayments,
    };

    // Format Loans
    const formattedLoans: LoanReportItem[] = (rawLoans || []).map((item: any) => {
      const cust = item.customers || {};
      const collected = Number(item.collected_amount || 0);
      const totalTarget = Number(item.total_collection || item.total_collection_amount || 0);
      const balance = item.balance_amount !== undefined ? Number(item.balance_amount) : Math.max(0, totalTarget - collected);

      const isClosed = item.is_closed !== undefined ? Boolean(item.is_closed) : balance <= 0;
      const lType = decodeLoanType(item.working_days, item.loan_type);
      const daysCount = lType === 'daily' ? Number(item.working_days || 100) : 100;
      const totalWks = decodeTotalWeeks(item.working_days, item.total_weeks);
      const totalMths = decodeTotalMonths(item.working_days, item.total_months);

      return {
        id: item.id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        loanType: lType,
        city: item.city || undefined,
        amountGiven: Number(item.amount_given || 0),
        targetAmount: totalTarget,
        dailyAmount: item.daily_amount ? Number(item.daily_amount) : Math.round((totalTarget / daysCount) * 100) / 100,
        weeklyAmount: item.weekly_amount ? Number(item.weekly_amount) : Math.round((totalTarget / Math.max(1, totalWks)) * 100) / 100,
        monthlyAmount: item.monthly_amount ? Number(item.monthly_amount) : Math.round((totalTarget / Math.max(1, totalMths)) * 100) / 100,
        startDate: item.start_date,
        endDate: item.end_date,
        remainingBalance: balance,
        status: isClosed ? 'closed' : 'active',
      };
    });

    // Format Collections
    const formattedCollections: CollectionReportItem[] = (rawCollections || []).map((item: any) => {
      const loan = item.loans || {};
      const cust = loan.customers || {};
      return {
        id: item.id,
        paymentDate: item.payment_date,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        amountPaid: Number(item.amount_paid || 0),
        remainingBalanceAfterPayment: Number(item.remaining_balance_after_payment || loan.balance_amount || 0),
        remarks: item.remarks || '-',
      };
    });

    // Format Customer Reports
    const customerReports: CustomerReportItem[] = (customersData || []).map((cust: any) => {
      const custLoans = formattedLoans.filter((l) => l.customerCode === cust.customer_id);
      const givenSum = custLoans.reduce((sum, l) => sum + l.amountGiven, 0);
      const targetSum = custLoans.reduce((sum, l) => sum + l.targetAmount, 0);
      const balanceSum = custLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
      const collectedSum = Math.max(0, targetSum - balanceSum);

      const activeL = custLoans.filter((l) => l.status === 'active');

      return {
        id: cust.id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        mobileNumber: cust.mobile_number || 'N/A',
        loanAmount: givenSum,
        totalTarget: targetSum,
        collectedAmount: collectedSum,
        remainingBalance: balanceSum,
        loanStatus: activeL.length > 0 ? 'active' : custLoans.length > 0 ? 'closed' : 'no_loan',
        loanType: custLoans[0]?.loanType || 'N/A',
      };
    });

    let filteredCustomerReports = customerReports;
    let filteredLoanReports = formattedLoans;
    let filteredCollectionReports = formattedCollections;

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filteredCustomerReports = customerReports.filter(
        (c) => c.customerCode.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q)
      );
      filteredLoanReports = formattedLoans.filter(
        (l) => l.customerCode.toLowerCase().includes(q) || l.customerName.toLowerCase().includes(q)
      );
      filteredCollectionReports = formattedCollections.filter(
        (c) => c.customerCode.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q)
      );
    }

    const totalCustomers = (customersData || []).length;
    const totalActiveLoans = formattedLoans.filter((l) => l.status === 'active').length;
    const totalClosedLoans = formattedLoans.filter((l) => l.status === 'closed').length;
    const totalAmountGiven = formattedLoans.reduce((sum, l) => sum + l.amountGiven, 0);
    const totalCollectionTarget = formattedLoans.reduce((sum, l) => sum + l.targetAmount, 0);
    const totalRemainingBalance = formattedLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const totalAmountCollected = Math.max(0, totalCollectionTarget - totalRemainingBalance);
    const recoveryPercentage = totalCollectionTarget > 0 ? Math.round((totalAmountCollected / totalCollectionTarget) * 100) : 0;

    const monthMap = new Map<string, number>();
    formattedCollections.forEach((c) => {
      const date = new Date(c.paymentDate);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + c.amountPaid);
      }
    });

    const monthlyTrendData = Array.from(monthMap.entries()).map(([m, val]) => ({
      month: m,
      collected: val,
    }));

    const dailyMap = new Map<string, number>();
    formattedCollections.forEach((c) => {
      dailyMap.set(c.paymentDate, (dailyMap.get(c.paymentDate) || 0) + c.amountPaid);
    });

    const dailyTrendData = Array.from(dailyMap.entries())
      .map(([d, val]) => ({ date: d, collected: val }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    const loanStatusPieData = [
      { name: 'Active Loans', value: totalActiveLoans, color: '#3b82f6' },
      { name: 'Closed Loans', value: totalClosedLoans, color: '#10b981' },
    ];

    // Fetch Investment Khata Data
    let investmentReportData: InvestmentReportData = {
      currentBalance: 0,
      investmentInterest: 0,
      loanInterest: 0,
      expenses: 0,
      netProfit: 0,
      monthlyInterestRate: 5.0,
      cashFlowReports: [],
    };

    try {
      const [invMetRes, invTxRes] = await Promise.all([
        getInvestmentMetrics(),
        getInvestmentTransactions(),
      ]);
      if (invMetRes.success && invMetRes.data) {
        investmentReportData = {
          ...invMetRes.data,
          cashFlowReports: invTxRes.data || [],
        };
      }
    } catch (invErr) {
      console.warn('Notice: Investment Khata report data skipped:', invErr);
    }

    let interestReportData: InterestReportData = {
      dailyInterest: 0,
      weeklyInterest: 0,
      monthlyInterest: 0,
      adjustmentInterest: 0,
      totalInterestCollected: 0,
      interestReports: [],
    };

    try {
      const [intMetRes, intTxRes] = await Promise.all([
        getInterestMetrics(),
        getInterestTransactions(),
      ]);
      if (intMetRes.success && intMetRes.data) {
        interestReportData = {
          ...intMetRes.data,
          interestReports: intTxRes.data || [],
        };
      }
    } catch (intErr) {
      console.warn('Notice: Interest report data skipped:', intErr);
    }

    return {
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalActiveLoans,
          totalClosedLoans,
          totalAmountGiven,
          totalCollectionTarget,
          totalAmountCollected,
          totalRemainingBalance,
          recoveryPercentage,
        },
        customerReports: filteredCustomerReports,
        collectionReports: filteredCollectionReports,
        loanReports: filteredLoanReports,
        monthlyTrendData,
        dailyTrendData,
        loanStatusPieData,
        expenseReportData,
        stampReportData,
        chitReportData,
        investmentReportData,
        interestReportData,
      },
    };
  } catch (err: any) {
    console.error('Error fetching reports data from Supabase:', err);
    return { success: false, data: null, error: err?.message || 'Failed to fetch reports data' };
  }
}
