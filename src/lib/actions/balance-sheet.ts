'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BalanceSheetItem {
  id: string;
  category: 'Assets' | 'Liabilities' | "Owner's Capital";
  particulars: string;
  amount: number;
  lastUpdated: string;
  note?: string;
}

export interface BalanceSheetData {
  asOfDate: string;
  assets: {
    cashInHand: number;
    cashInBank: number;
    loansReceivable: number;
    activeInvestment: number;
    otherAssets: number;
    totalAssets: number;
  };
  liabilities: {
    depositsPayable: number;
    otherPayables: number;
    totalLiabilities: number;
  };
  ownersCapital: {
    totalCapitalAdded: number;
    capitalWithdrawn: number;
    currentOwnerCapital: number;
    retainedEarnings: number;
    totalCapitalAndRetained: number;
  };
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    ownersCapitalTotal: number;
    totalLiabilitiesAndCapital: number;
    netPosition: number;
    isBalanced: boolean;
    difference: number;
  };
  items: BalanceSheetItem[];
}

export async function getBalanceSheetData(asOfDateInput?: string): Promise<BalanceSheetData> {
  const asOfDate = asOfDateInput || new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch Loans Receivable (SUM of remaining_balance on active loans)
    const { data: activeLoans, error: loansErr } = await supabase
      .from('loans')
      .select('remaining_balance, amount_given, is_closed, created_at')
      .eq('is_closed', false);

    let loansReceivable = 0;
    if (!loansErr && activeLoans) {
      loansReceivable = activeLoans.reduce((sum, l) => sum + (Number(l.remaining_balance) || 0), 0);
    }

    // 2. Fetch Investment Transactions & Central Cash Flow
    const { data: invTx, error: invErr } = await supabase
      .from('investment_transactions')
      .select('*')
      .lte('transaction_date', asOfDate);

    let cashInHand = 0;
    let activeInvestment = 0;
    let totalCapitalAdded = 0;
    let capitalWithdrawn = 0;

    if (!invErr && invTx) {
      let runBal = 0;
      invTx.forEach((tx) => {
        const amtIn = Number(tx.amount_in) || 0;
        const amtOut = Number(tx.amount_out) || 0;
        runBal += amtIn - amtOut;

        const desc = (tx.description || '').toLowerCase();
        if (desc.includes('capital added') || desc.includes('direct investment') || desc.includes('owner capital')) {
          totalCapitalAdded += amtIn;
        } else if (desc.includes('capital withdrawn') || desc.includes('taken capital') || desc.includes('owner withdrawal')) {
          capitalWithdrawn += amtOut;
        }
      });

      cashInHand = runBal > 0 ? runBal : 0;
      activeInvestment = totalCapitalAdded > capitalWithdrawn ? totalCapitalAdded - capitalWithdrawn : totalCapitalAdded;
    }

    // 3. Fetch Depositors Outstanding Payable
    const { data: depAcc, error: depErr } = await supabase
      .from('depositor_accounts')
      .select('id, deposit_amount, status');

    let depositsPayable = 0;
    if (!depErr && depAcc) {
      depositsPayable = depAcc.reduce((sum, d) => sum + (Number(d.deposit_amount) || 0), 0);
    }

    // 4. Fetch Stamps Value (Other Assets)
    const { data: stampsData, error: stampsErr } = await supabase
      .from('stamps')
      .select('amount, cost');

    let otherAssets = 0;
    if (!stampsErr && stampsData) {
      otherAssets = stampsData.reduce((sum, s) => sum + (Number(s.amount) || Number(s.cost) || 0), 0);
    }

    // 5. Calculate Retained Earnings (Net Profit from P&L: Loan Interest - Expenses)
    const { data: collectionsData } = await supabase.from('collections').select('amount');
    const { data: expensesData } = await supabase.from('expenses').select('amount');

    const totalCollected = (collectionsData || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalExpenses = (expensesData || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const retainedEarnings = Math.max(0, totalCollected - totalExpenses);

    // Compute Totals
    const cashInBank = 0; // Default safe 0 if bank integration not configured
    const otherPayables = 0;

    const totalAssets = cashInHand + cashInBank + loansReceivable + activeInvestment + otherAssets;
    const totalLiabilities = depositsPayable + otherPayables;
    const currentOwnerCapital = Math.max(0, totalCapitalAdded - capitalWithdrawn);
    const totalCapitalAndRetained = currentOwnerCapital + retainedEarnings;

    const totalLiabilitiesAndCapital = totalLiabilities + totalCapitalAndRetained;
    const netPosition = totalAssets - totalLiabilities;
    const difference = Math.abs(totalAssets - totalLiabilitiesAndCapital);
    const isBalanced = difference < 1.0;

    // Detailed Breakdown Items List for Table
    const items: BalanceSheetItem[] = [
      {
        id: 'asset-1',
        category: 'Assets',
        particulars: 'Cash in Hand (Central Cash Balance)',
        amount: cashInHand,
        lastUpdated: asOfDate,
        note: 'Live net cash balance from central cash flow ledger',
      },
      {
        id: 'asset-2',
        category: 'Assets',
        particulars: 'Cash in Bank',
        amount: cashInBank,
        lastUpdated: asOfDate,
        note: 'Bank account cash holdings',
      },
      {
        id: 'asset-3',
        category: 'Assets',
        particulars: 'Loans Receivable (Customer Outstanding)',
        amount: loansReceivable,
        lastUpdated: asOfDate,
        note: 'SUM of active loan principal balances expected from borrowers',
      },
      {
        id: 'asset-4',
        category: 'Assets',
        particulars: 'Active Investment Capital',
        amount: activeInvestment,
        lastUpdated: asOfDate,
        note: 'Direct business capital deployed in Investment Khata',
      },
      {
        id: 'asset-5',
        category: 'Assets',
        particulars: 'Other Assets (Stamps Inventory)',
        amount: otherAssets,
        lastUpdated: asOfDate,
        note: 'Physical stamp holdings and document assets',
      },
      {
        id: 'liab-1',
        category: 'Liabilities',
        particulars: 'Deposits / Amount Payable to Depositors',
        amount: depositsPayable,
        lastUpdated: asOfDate,
        note: 'Total principal payable to active depositors',
      },
      {
        id: 'liab-2',
        category: 'Liabilities',
        particulars: 'Other Payables',
        amount: otherPayables,
        lastUpdated: asOfDate,
        note: 'Pending vendor or operational payables',
      },
      {
        id: 'cap-1',
        category: "Owner's Capital",
        particulars: "Owner's Capital Added",
        amount: totalCapitalAdded,
        lastUpdated: asOfDate,
        note: 'Cumulative direct capital added by owner',
      },
      {
        id: 'cap-2',
        category: "Owner's Capital",
        particulars: "Capital Withdrawn",
        amount: capitalWithdrawn,
        lastUpdated: asOfDate,
        note: 'Cumulative business capital taken out by owner',
      },
      {
        id: 'cap-3',
        category: "Owner's Capital",
        particulars: 'Retained Earnings / Accumulated Net Profit',
        amount: retainedEarnings,
        lastUpdated: asOfDate,
        note: 'Cumulative net profit retained in business',
      },
    ];

    return {
      asOfDate,
      assets: {
        cashInHand,
        cashInBank,
        loansReceivable,
        activeInvestment,
        otherAssets,
        totalAssets,
      },
      liabilities: {
        depositsPayable,
        otherPayables,
        totalLiabilities,
      },
      ownersCapital: {
        totalCapitalAdded,
        capitalWithdrawn,
        currentOwnerCapital,
        retainedEarnings,
        totalCapitalAndRetained,
      },
      summary: {
        totalAssets,
        totalLiabilities,
        ownersCapitalTotal: totalCapitalAndRetained,
        totalLiabilitiesAndCapital,
        netPosition,
        isBalanced,
        difference,
      },
      items,
    };
  } catch (err) {
    console.error('Error calculating Balance Sheet data:', err);
    // Safe Fallback
    return {
      asOfDate,
      assets: {
        cashInHand: 0,
        cashInBank: 0,
        loansReceivable: 0,
        activeInvestment: 0,
        otherAssets: 0,
        totalAssets: 0,
      },
      liabilities: {
        depositsPayable: 0,
        otherPayables: 0,
        totalLiabilities: 0,
      },
      ownersCapital: {
        totalCapitalAdded: 0,
        capitalWithdrawn: 0,
        currentOwnerCapital: 0,
        retainedEarnings: 0,
        totalCapitalAndRetained: 0,
      },
      summary: {
        totalAssets: 0,
        totalLiabilities: 0,
        ownersCapitalTotal: 0,
        totalLiabilitiesAndCapital: 0,
        netPosition: 0,
        isBalanced: true,
        difference: 0,
      },
      items: [],
    };
  }
}
