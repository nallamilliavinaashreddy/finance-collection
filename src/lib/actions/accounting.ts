'use server';

import { createClient } from '@/lib/supabase/client';
import { ManualBalanceSheetEntry, ManualBalanceSheetEntryType, ManualBalanceSheetCategory } from '@/types';

export interface LedgerAccountItem {
  id: string;
  accountName: string;
  category: 'Asset' | 'Liability' | 'Capital' | 'Income' | 'Expense';
  systemAmount: number;
  manualAmount: number;
  totalAmount: number;
  note?: string;
  isManual?: boolean;
}

export interface TrialBalanceData {
  asOfDate: string;
  periodLabel: string;
  debitAccounts: LedgerAccountItem[];
  creditAccounts: LedgerAccountItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  difference: number;
}

export interface ProfitAndLossStatementData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  incomeAccounts: LedgerAccountItem[];
  expenseAccounts: LedgerAccountItem[];
  totalIncome: number;
  totalExpenses: number;
  netProfitOrLoss: number;
  isNetProfit: boolean;
}

export interface BalanceSheetStatementData {
  asOfDate: string;
  periodLabel: string;
  liabilitiesAndCapital: {
    capitalAccounts: LedgerAccountItem[];
    liabilityAccounts: LedgerAccountItem[];
    subtotalCapital: number;
    subtotalLiabilities: number;
    retainedNetProfit: number;
    totalLiabilitiesAndCapital: number;
  };
  assets: {
    assetAccounts: LedgerAccountItem[];
    totalAssets: number;
  };
  summary: {
    totalAssets: number;
    totalLiabilitiesAndCapital: number;
    isBalanced: boolean;
    difference: number;
  };
  manualEntries: ManualBalanceSheetEntry[];
}

export interface FinancialStatementsBundle {
  asOfDate: string;
  trialBalance: TrialBalanceData;
  profitAndLoss: ProfitAndLossStatementData;
  balanceSheet: BalanceSheetStatementData;
}

function isTableNotFoundError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const message = err.message || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('relation')
  );
}

/**
 * Fetch all manual balance sheet entries up to asOfDate
 */
export async function getManualEntries(asOfDate?: string): Promise<ManualBalanceSheetEntry[]> {
  const supabase = createClient();
  try {
    let query = supabase
      .from('manual_balance_sheet_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (asOfDate) {
      query = query.lte('entry_date', asOfDate);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) return [];
      console.warn('Manual entries fetch notice:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      entryType: row.entry_type as ManualBalanceSheetEntryType,
      category: row.category as ManualBalanceSheetCategory,
      amount: Number(row.amount) || 0,
      entryDate: row.entry_date || new Date().toISOString().split('T')[0],
      description: row.description || '',
      createdBy: row.created_by || 'Admin',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Central Accounting Engine: Computes Trial Balance, P&L, and Balance Sheet dynamically from real Supabase tables
 */
export async function getFinancialStatements(
  asOfDateInput?: string,
  startDateInput?: string,
  endDateInput?: string
): Promise<FinancialStatementsBundle> {
  const supabase = createClient();

  const todayISO = new Date().toISOString().split('T')[0];
  const asOfDate = asOfDateInput && asOfDateInput.trim().length === 10 ? asOfDateInput.trim() : todayISO;
  const startDate = startDateInput || `${asOfDate.substring(0, 4)}-01-01`;
  const endDate = endDateInput || asOfDate;

  // 1. Fetch Loans Receivable (SUM of balance_amount for active loans)
  let sysLoansReceivable = 0;
  try {
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('balance_amount, is_closed')
      .eq('is_closed', false);

    if (activeLoans) {
      sysLoansReceivable = activeLoans.reduce((sum: number, l: any) => sum + Number(l.balance_amount || 0), 0);
    }
  } catch (err) {
    console.warn('Notice: Loans receivable accounting calculation error:', err);
  }

  // 2. Fetch Central Net Cash Flow & Capital from investment_transactions up to asOfDate
  let sysCashInHand = 0;
  let sysActiveInvestment = 0;
  let sysCapitalAdded = 0;
  let sysCapitalWithdrawn = 0;
  let sysInvestmentInterestPaid = 0;

  try {
    const { data: invTx } = await supabase
      .from('investment_transactions')
      .select('*')
      .lte('transaction_date', asOfDate);

    if (invTx) {
      let runningCash = 0;
      invTx.forEach((tx: any) => {
        const amtIn = Number(tx.amount_in || 0);
        const amtOut = Number(tx.amount_out || 0);
        runningCash += (amtIn - amtOut);

        const type = String(tx.transaction_type || '').toLowerCase();
        const remarks = String(tx.remarks || '').toLowerCase();

        if (type === 'capital added' || remarks.includes('direct investment') || remarks.includes('capital added')) {
          sysCapitalAdded += amtIn;
        } else if (type === 'business withdrawal' || type === 'capital returned' || remarks.includes('capital withdrawn')) {
          sysCapitalWithdrawn += amtOut;
        } else if (type === 'annual interest' || type === 'daily interest' || tx.reference_type === 'yearly_interest') {
          sysInvestmentInterestPaid += Number(tx.daily_interest_added || amtOut || 0);
        }
      });

      sysCashInHand = runningCash > 0 ? runningCash : 0;
      sysActiveInvestment = Math.max(0, sysCapitalAdded - sysCapitalWithdrawn);
    }
  } catch (err) {
    console.warn('Notice: Investment transactions accounting calculation error:', err);
  }

  // 3. Fetch Stamps Inventory (Other Assets)
  let sysStampsValue = 0;
  let sysStampsIncome = 0;
  try {
    const { data: stampsData } = await supabase.from('stamps').select('amount, cost, stamp_date').lte('stamp_date', asOfDate);
    if (stampsData) {
      sysStampsValue = stampsData.reduce((sum: number, s: any) => sum + (Number(s.amount) || Number(s.cost) || 0), 0);
      sysStampsIncome = sysStampsValue;
    }
  } catch (err) {
    console.warn('Notice: Stamps accounting calculation error:', err);
  }

  // 4. Fetch Depositors Outstanding Payable
  let sysDepositsPayable = 0;
  try {
    const { data: depAcc } = await supabase.from('depositor_accounts').select('deposit_amount, status');
    if (depAcc) {
      sysDepositsPayable = depAcc.reduce((sum: number, d: any) => sum + Number(d.deposit_amount || 0), 0);
    }
  } catch (err) {
    console.warn('Notice: Depositor accounts accounting calculation error:', err);
  }

  // 5. Fetch Loan Interest Income (from interest_transactions & collections)
  let sysLoanInterestIncome = 0;
  try {
    const { data: intTx } = await supabase.from('interest_transactions').select('interest_amount, transaction_date').lte('transaction_date', asOfDate);
    if (intTx && intTx.length > 0) {
      sysLoanInterestIncome = intTx.reduce((sum: number, r: any) => sum + Number(r.interest_amount || 0), 0);
    } else {
      // Fallback calculation from loans (Total Target - Amount Given)
      const { data: allLoans } = await supabase.from('loans').select('amount_given, total_collection, collected_amount');
      if (allLoans) {
        allLoans.forEach((l: any) => {
          const target = Number(l.total_collection || 0);
          const given = Number(l.amount_given || 0);
          const collected = Number(l.collected_amount || 0);
          const totalInterest = Math.max(0, target - given);
          const interestRatio = target > 0 ? totalInterest / target : 0;
          sysLoanInterestIncome += (collected * interestRatio);
        });
      }
    }
  } catch (err) {
    console.warn('Notice: Interest income accounting calculation error:', err);
  }

  // 6. Fetch Expenses up to asOfDate
  let sysOperationalExpenses = 0;
  try {
    const { data: expData } = await supabase.from('expenses').select('amount, expense_date').lte('expense_date', asOfDate);
    if (expData) {
      sysOperationalExpenses = expData.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    }
  } catch (err) {
    console.warn('Notice: Expenses accounting calculation error:', err);
  }

  // 7. Fetch Chits & Chit Payments up to asOfDate
  let sysChitInstallmentsPaid = 0;
  let sysChitProfit = 0;
  try {
    const { data: chitPay } = await supabase.from('chit_payments').select('amount, payment_date').lte('payment_date', asOfDate);
    if (chitPay) {
      sysChitInstallmentsPaid = chitPay.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    }
  } catch (err) {
    console.warn('Notice: Chit payments accounting calculation error:', err);
  }

  // 8. Fetch Manual Entries
  const manualEntries = await getManualEntries(asOfDate);

  let manualCashInHand = 0;
  let manualCashInBank = 0;
  let manualLoansReceivable = 0;
  let manualActiveInvestment = 0;
  let manualOtherAssets = 0;
  let manualDepositsPayable = 0;
  let manualOtherPayables = 0;
  let manualCapitalAdded = 0;
  let manualCapitalWithdrawn = 0;
  let manualExpenseAdjustment = 0;

  manualEntries.forEach((e: any) => {
    const amt = Number(e.amount) || 0;
    switch (e.category) {
      case 'Cash in Hand': manualCashInHand += amt; break;
      case 'Cash in Bank': manualCashInBank += amt; break;
      case 'Loans Receivable': manualLoansReceivable += amt; break;
      case 'Active Investment': manualActiveInvestment += amt; break;
      case 'Other Asset': manualOtherAssets += amt; break;
      case 'Deposits / Amount Payable': manualDepositsPayable += amt; break;
      case 'Other Payable': manualOtherPayables += amt; break;
      case 'Capital Added': manualCapitalAdded += amt; break;
      case 'Capital Withdrawn': manualCapitalWithdrawn += amt; break;
      case 'Expense Adjustment': manualExpenseAdjustment += amt; break;
    }
  });

  // PROFIT & LOSS CALCULATIONS
  const totalIncome = Math.round((sysLoanInterestIncome + sysStampsIncome + sysChitProfit) * 100) / 100;
  const totalExpenses = Math.round((sysOperationalExpenses + sysInvestmentInterestPaid + manualExpenseAdjustment) * 100) / 100;
  const netProfitOrLoss = Math.round((totalIncome - totalExpenses) * 100) / 100;
  const isNetProfit = netProfitOrLoss >= 0;

  const incomeAccounts: LedgerAccountItem[] = [
    {
      id: 'inc-1',
      accountName: 'Loan Interest Income (వడ్డీ ఖాతా)',
      category: 'Income',
      systemAmount: sysLoanInterestIncome,
      manualAmount: 0,
      totalAmount: sysLoanInterestIncome,
      note: 'Total loan interest accrued and collected across Daily, Weekly, Monthly, and Adjustment loans',
    },
    {
      id: 'inc-2',
      accountName: 'Stamps Fee Income (స్టాంపుల ఆదాయం)',
      category: 'Income',
      systemAmount: sysStampsIncome,
      manualAmount: 0,
      totalAmount: sysStampsIncome,
      note: 'Revenue collected from customer legal stamp & documentation fees',
    },
    {
      id: 'inc-3',
      accountName: 'Chit Dividends & Dividend Profit (చిట్ లాభం)',
      category: 'Income',
      systemAmount: sysChitProfit,
      manualAmount: 0,
      totalAmount: sysChitProfit,
      note: 'Dividend distributions and prize bonuses earned from chit subscriptions',
    },
  ];

  const expenseAccounts: LedgerAccountItem[] = [
    {
      id: 'exp-1',
      accountName: 'Operational Expenses (సాధారణ ఖర్చులు)',
      category: 'Expense',
      systemAmount: sysOperationalExpenses,
      manualAmount: manualExpenseAdjustment,
      totalAmount: sysOperationalExpenses + manualExpenseAdjustment,
      note: 'Office rent, utilities, stationery, salaries, and routine business expenses + manual adjustments',
    },
    {
      id: 'exp-2',
      accountName: 'Investment Capital Interest Cost (పెట్టుబడి వడ్డీ)',
      category: 'Expense',
      systemAmount: sysInvestmentInterestPaid,
      manualAmount: 0,
      totalAmount: sysInvestmentInterestPaid,
      note: 'Annual simple interest cost accrued on deployed owner capital',
    },
  ];

  const profitAndLoss: ProfitAndLossStatementData = {
    periodLabel: `Financial Period ending ${asOfDate}`,
    startDate,
    endDate,
    incomeAccounts,
    expenseAccounts,
    totalIncome,
    totalExpenses,
    netProfitOrLoss,
    isNetProfit,
  };

  // BALANCE SHEET CALCULATIONS
  const totalOwnerCapitalAdded = sysCapitalAdded + manualCapitalAdded;
  const totalOwnerCapitalWithdrawn = sysCapitalWithdrawn + manualCapitalWithdrawn;
  const netOwnerCapital = Math.max(0, totalOwnerCapitalAdded - totalOwnerCapitalWithdrawn);

  const capitalAccounts: LedgerAccountItem[] = [
    {
      id: 'cap-1',
      accountName: "Owner's Capital (పెట్టుబడి ఖాతా)",
      category: 'Capital',
      systemAmount: Math.max(0, sysCapitalAdded - sysCapitalWithdrawn),
      manualAmount: manualCapitalAdded - manualCapitalWithdrawn,
      totalAmount: netOwnerCapital,
      note: 'Direct business capital deployed by owner net of capital withdrawals',
    },
  ];

  const liabilityAccounts: LedgerAccountItem[] = [
    {
      id: 'liab-1',
      accountName: 'Depositors Payable (డిపాజిట్లు / అప్పులు)',
      category: 'Liability',
      systemAmount: sysDepositsPayable,
      manualAmount: manualDepositsPayable,
      totalAmount: sysDepositsPayable + manualDepositsPayable,
      note: 'Outstanding principal payable to active depositors + manual adjustments',
    },
    {
      id: 'liab-2',
      accountName: 'Chit Subscriptions Payable (చిట్ పాటలు)',
      category: 'Liability',
      systemAmount: sysChitInstallmentsPaid,
      manualAmount: 0,
      totalAmount: sysChitInstallmentsPaid,
      note: 'Cumulative chit pool contributions paid',
    },
    {
      id: 'liab-3',
      accountName: 'Other Payables & Vendor Liabilities (ఇతర చెల్లింపులు)',
      category: 'Liability',
      systemAmount: 0,
      manualAmount: manualOtherPayables,
      totalAmount: manualOtherPayables,
      note: 'Pending vendor or operational payables',
    },
  ];

  const subtotalCapital = netOwnerCapital;
  const subtotalLiabilities = (sysDepositsPayable + manualDepositsPayable) + sysChitInstallmentsPaid + manualOtherPayables;
  const retainedNetProfit = netProfitOrLoss;

  const totalLiabilitiesAndCapital = Math.round((subtotalCapital + subtotalLiabilities + retainedNetProfit) * 100) / 100;

  const assetAccounts: LedgerAccountItem[] = [
    {
      id: 'ast-1',
      accountName: 'Cash in Hand (చేతిలో నిల్వ / Cash Flow)',
      category: 'Asset',
      systemAmount: sysCashInHand,
      manualAmount: manualCashInHand,
      totalAmount: sysCashInHand + manualCashInHand,
      note: 'Live net cash balance from central cash flow ledger + manual cash adjustments',
    },
    {
      id: 'ast-2',
      accountName: 'Loans Receivable (కస్టమర్ల అసలు నిల్వ)',
      category: 'Asset',
      systemAmount: sysLoansReceivable,
      manualAmount: manualLoansReceivable,
      totalAmount: sysLoansReceivable + manualLoansReceivable,
      note: 'SUM of outstanding principal balances on active loans + manual loan adjustments',
    },
    {
      id: 'ast-3',
      accountName: 'Stamps Inventory & Legal Assets (స్టాంపులు)',
      category: 'Asset',
      systemAmount: sysStampsValue,
      manualAmount: manualOtherAssets,
      totalAmount: sysStampsValue + manualOtherAssets,
      note: 'Physical stamp holdings and legal agreement documents + manual adjustments',
    },
    {
      id: 'ast-4',
      accountName: 'Cash in Bank (బ్యాంకు నిల్వ)',
      category: 'Asset',
      systemAmount: 0,
      manualAmount: manualCashInBank,
      totalAmount: manualCashInBank,
      note: 'Bank account holdings and manual bank balances',
    },
  ];

  const totalAssets = Math.round(assetAccounts.reduce((sum: number, a: LedgerAccountItem) => sum + a.totalAmount, 0) * 100) / 100;
  const bsDifference = Math.abs(Math.round((totalAssets - totalLiabilitiesAndCapital) * 100) / 100);
  const isBsBalanced = bsDifference < 1.0;

  const balanceSheet: BalanceSheetStatementData = {
    asOfDate,
    periodLabel: `As of ${asOfDate}`,
    liabilitiesAndCapital: {
      capitalAccounts,
      liabilityAccounts,
      subtotalCapital,
      subtotalLiabilities,
      retainedNetProfit,
      totalLiabilitiesAndCapital,
    },
    assets: {
      assetAccounts,
      totalAssets,
    },
    summary: {
      totalAssets,
      totalLiabilitiesAndCapital,
      isBalanced: isBsBalanced,
      difference: bsDifference,
    },
    manualEntries,
  };

  // TRIAL BALANCE CALCULATIONS
  // Debit Accounts = Assets + Expenses
  const debitAccounts: LedgerAccountItem[] = [
    ...assetAccounts,
    ...expenseAccounts,
  ];
  const totalDebit = Math.round(debitAccounts.reduce((sum: number, a: LedgerAccountItem) => sum + a.totalAmount, 0) * 100) / 100;

  // Credit Accounts = Capital + Liabilities + Income
  const creditAccounts: LedgerAccountItem[] = [
    ...capitalAccounts,
    ...liabilityAccounts,
    ...incomeAccounts,
  ];
  const totalCredit = Math.round(creditAccounts.reduce((sum: number, a: LedgerAccountItem) => sum + a.totalAmount, 0) * 100) / 100;

  const tbDifference = Math.abs(Math.round((totalDebit - totalCredit) * 100) / 100);
  const isTbBalanced = tbDifference < 1.0;

  const trialBalance: TrialBalanceData = {
    asOfDate,
    periodLabel: `Trial Balance as of ${asOfDate}`,
    debitAccounts,
    creditAccounts,
    totalDebit,
    totalCredit,
    isBalanced: isTbBalanced,
    difference: tbDifference,
  };

  return {
    asOfDate,
    trialBalance,
    profitAndLoss,
    balanceSheet,
  };
}
