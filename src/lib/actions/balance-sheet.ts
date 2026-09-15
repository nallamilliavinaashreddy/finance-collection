'use server';

import { createClient } from '@supabase/supabase-js';
import {
  ManualBalanceSheetEntry,
  ManualBalanceSheetEntryType,
  ManualBalanceSheetCategory,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MetricBreakdown {
  systemAmount: number;
  manualAmount: number;
  totalAmount: number;
}

export interface BalanceSheetItem {
  id: string;
  category: 'Assets' | 'Liabilities' | "Owner's Capital";
  particulars: string;
  amount: number;
  systemAmount?: number;
  manualAmount?: number;
  lastUpdated: string;
  note?: string;
  isManual?: boolean;
}

export interface BalanceSheetData {
  asOfDate: string;
  assets: {
    cashInHand: MetricBreakdown;
    cashInBank: MetricBreakdown;
    loansReceivable: MetricBreakdown;
    activeInvestment: MetricBreakdown;
    otherAssets: MetricBreakdown;
    totalAssets: MetricBreakdown;
  };
  liabilities: {
    depositsPayable: MetricBreakdown;
    otherPayables: MetricBreakdown;
    totalLiabilities: MetricBreakdown;
  };
  ownersCapital: {
    totalCapitalAdded: MetricBreakdown;
    capitalWithdrawn: MetricBreakdown;
    currentOwnerCapital: MetricBreakdown;
    retainedEarnings: MetricBreakdown;
    totalCapitalAndRetained: MetricBreakdown;
  };
  summary: {
    totalAssets: MetricBreakdown;
    totalLiabilities: MetricBreakdown;
    ownersCapitalTotal: MetricBreakdown;
    totalLiabilitiesAndCapital: number;
    netPosition: MetricBreakdown;
    isBalanced: boolean;
    difference: number;
  };
  items: BalanceSheetItem[];
  manualEntries: ManualBalanceSheetEntry[];
}

function isTableNotFoundError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const message = err.message || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('manual_balance_sheet_entries') ||
    message.includes('schema cache') ||
    message.includes('relation')
  );
}

export async function getManualBalanceSheetEntries(): Promise<ManualBalanceSheetEntry[]> {
  try {
    const { data, error } = await supabase
      .from('manual_balance_sheet_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) {
      if (isTableNotFoundError(error)) {
        console.warn('manual_balance_sheet_entries table not found, returning empty array');
        return [];
      }
      console.error('Error fetching manual balance sheet entries:', error);
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
    console.error('Failed to get manual balance sheet entries:', err);
    return [];
  }
}

export async function createManualBalanceSheetEntry(formData: {
  entryType: ManualBalanceSheetEntryType;
  category: ManualBalanceSheetCategory;
  amount: number;
  entryDate: string;
  description: string;
  createdBy?: string;
}): Promise<{ success: boolean; data?: ManualBalanceSheetEntry; error?: string }> {
  try {
    const payload = {
      entry_type: formData.entryType,
      category: formData.category,
      amount: formData.amount,
      entry_date: formData.entryDate,
      description: formData.description,
      created_by: formData.createdBy || 'Admin',
    };

    const { data, error } = await supabase
      .from('manual_balance_sheet_entries')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (isTableNotFoundError(error)) {
        return {
          success: false,
          error: 'Table manual_balance_sheet_entries does not exist in database yet.',
        };
      }
      return { success: false, error: error.message };
    }

    const created: ManualBalanceSheetEntry = {
      id: data.id,
      entryType: data.entry_type,
      category: data.category,
      amount: Number(data.amount) || 0,
      entryDate: data.entry_date,
      description: data.description,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create manual entry' };
  }
}

export async function updateManualBalanceSheetEntry(
  id: string,
  formData: {
    entryType: ManualBalanceSheetEntryType;
    category: ManualBalanceSheetCategory;
    amount: number;
    entryDate: string;
    description: string;
  }
): Promise<{ success: boolean; data?: ManualBalanceSheetEntry; error?: string }> {
  try {
    const payload = {
      entry_type: formData.entryType,
      category: formData.category,
      amount: formData.amount,
      entry_date: formData.entryDate,
      description: formData.description,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('manual_balance_sheet_entries')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updated: ManualBalanceSheetEntry = {
      id: data.id,
      entryType: data.entry_type,
      category: data.category,
      amount: Number(data.amount) || 0,
      entryDate: data.entry_date,
      description: data.description,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update manual entry' };
  }
}

export async function deleteManualBalanceSheetEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('manual_balance_sheet_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete manual entry' };
  }
}

export async function getBalanceSheetData(asOfDateInput?: string): Promise<BalanceSheetData> {
  const asOfDate = asOfDateInput || new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch Loans Receivable (SUM of balance_amount on active loans)
    const { data: activeLoans, error: loansErr } = await supabase
      .from('loans')
      .select('balance_amount, amount_given, is_closed, created_at')
      .eq('is_closed', false);

    let sysLoansReceivable = 0;
    if (!loansErr && activeLoans) {
      sysLoansReceivable = activeLoans.reduce((sum, l) => sum + (Number(l.balance_amount) || 0), 0);
    }

    // 2. Fetch Investment Transactions & Central Cash Flow
    const { data: invTx, error: invErr } = await supabase
      .from('investment_transactions')
      .select('*')
      .lte('transaction_date', asOfDate);

    let sysCashInHand = 0;
    let sysActiveInvestment = 0;
    let sysTotalCapitalAdded = 0;
    let sysCapitalWithdrawn = 0;

    if (!invErr && invTx) {
      let runBal = 0;
      invTx.forEach((tx) => {
        const amtIn = Number(tx.amount_in) || 0;
        const amtOut = Number(tx.amount_out) || 0;
        runBal += amtIn - amtOut;

        const desc = (tx.remarks || tx.transaction_type || '').toLowerCase();
        if (desc.includes('capital added') || desc.includes('direct investment') || desc.includes('owner capital')) {
          sysTotalCapitalAdded += amtIn;
        } else if (desc.includes('capital withdrawn') || desc.includes('taken capital') || desc.includes('owner withdrawal')) {
          sysCapitalWithdrawn += amtOut;
        }
      });

      sysCashInHand = runBal > 0 ? runBal : 0;
      sysActiveInvestment = sysTotalCapitalAdded > sysCapitalWithdrawn ? sysTotalCapitalAdded - sysCapitalWithdrawn : sysTotalCapitalAdded;
    }

    // 3. Fetch Depositors Outstanding Payable
    const { data: depAcc, error: depErr } = await supabase
      .from('depositor_accounts')
      .select('id, deposit_amount, status');

    let sysDepositsPayable = 0;
    if (!depErr && depAcc) {
      sysDepositsPayable = depAcc.reduce((sum, d) => sum + (Number(d.deposit_amount) || 0), 0);
    }

    // 4. Fetch Stamps Value (Other Assets)
    const { data: stampsData, error: stampsErr } = await supabase
      .from('stamps')
      .select('amount, cost');

    let sysOtherAssets = 0;
    if (!stampsErr && stampsData) {
      sysOtherAssets = stampsData.reduce((sum, s) => sum + (Number(s.amount) || Number(s.cost) || 0), 0);
    }

    // 5. Calculate Retained Earnings (Net Profit from P&L: Loan Interest - Expenses)
    const { data: collectionsData } = await supabase.from('collections').select('amount_paid');
    const { data: expensesData } = await supabase.from('expenses').select('amount');

    const totalCollected = (collectionsData || []).reduce((s, c) => s + (Number(c.amount_paid) || 0), 0);
    const totalExpenses = (expensesData || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const sysRetainedEarnings = Math.max(0, totalCollected - totalExpenses);
    const sysCashInBank = 0;
    const sysOtherPayables = 0;

    // 6. Fetch Manual Entries up to asOfDate
    const allManualEntries = await getManualBalanceSheetEntries();
    const manualEntries = allManualEntries.filter(
      (e) => !e.entryDate || e.entryDate <= asOfDate
    );

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

    manualEntries.forEach((entry) => {
      const amt = Number(entry.amount) || 0;
      switch (entry.category) {
        case 'Cash in Hand':
          manualCashInHand += amt;
          break;
        case 'Cash in Bank':
          manualCashInBank += amt;
          break;
        case 'Loans Receivable':
          manualLoansReceivable += amt;
          break;
        case 'Active Investment':
          manualActiveInvestment += amt;
          break;
        case 'Other Asset':
          manualOtherAssets += amt;
          break;
        case 'Deposits / Amount Payable':
          manualDepositsPayable += amt;
          break;
        case 'Other Payable':
          manualOtherPayables += amt;
          break;
        case 'Capital Added':
          manualCapitalAdded += amt;
          break;
        case 'Capital Withdrawn':
          manualCapitalWithdrawn += amt;
          break;
        case 'Expense Adjustment':
          manualExpenseAdjustment += amt;
          break;
      }
    });

    const createBreakdown = (sys: number, man: number): MetricBreakdown => ({
      systemAmount: sys,
      manualAmount: man,
      totalAmount: sys + man,
    });

    const cashInHand = createBreakdown(sysCashInHand, manualCashInHand);
    const cashInBank = createBreakdown(sysCashInBank, manualCashInBank);
    const loansReceivable = createBreakdown(sysLoansReceivable, manualLoansReceivable);
    const activeInvestment = createBreakdown(sysActiveInvestment, manualActiveInvestment);
    const otherAssets = createBreakdown(sysOtherAssets, manualOtherAssets);

    const sysTotalAssets = sysCashInHand + sysCashInBank + sysLoansReceivable + sysActiveInvestment + sysOtherAssets;
    const manTotalAssets = manualCashInHand + manualCashInBank + manualLoansReceivable + manualActiveInvestment + manualOtherAssets;
    const totalAssets = createBreakdown(sysTotalAssets, manTotalAssets);

    const depositsPayable = createBreakdown(sysDepositsPayable, manualDepositsPayable);
    const otherPayables = createBreakdown(sysOtherPayables, manualOtherPayables);

    const sysTotalLiabilities = sysDepositsPayable + sysOtherPayables;
    const manTotalLiabilities = manualDepositsPayable + manualOtherPayables;
    const totalLiabilities = createBreakdown(sysTotalLiabilities, manTotalLiabilities);

    const totalCapitalAdded = createBreakdown(sysTotalCapitalAdded, manualCapitalAdded);
    const capitalWithdrawn = createBreakdown(sysCapitalWithdrawn, manualCapitalWithdrawn);
    const currentOwnerCapital = createBreakdown(
      Math.max(0, sysTotalCapitalAdded - sysCapitalWithdrawn),
      manualCapitalAdded - manualCapitalWithdrawn
    );

    const retainedEarnings = createBreakdown(sysRetainedEarnings, manualExpenseAdjustment);
    const totalCapitalAndRetained = createBreakdown(
      currentOwnerCapital.systemAmount + retainedEarnings.systemAmount,
      currentOwnerCapital.manualAmount + retainedEarnings.manualAmount
    );

    const sysNetPosition = sysTotalAssets - sysTotalLiabilities;
    const manNetPosition = manTotalAssets - manTotalLiabilities;
    const netPosition = createBreakdown(sysNetPosition, manNetPosition);

    const totalLiabilitiesAndCapital = totalLiabilities.totalAmount + totalCapitalAndRetained.totalAmount;
    const difference = Math.abs(totalAssets.totalAmount - totalLiabilitiesAndCapital);
    const isBalanced = difference < 1.0;

    // Build Items List including system breakdown & manual entries
    const items: BalanceSheetItem[] = [
      {
        id: 'asset-1',
        category: 'Assets',
        particulars: 'Cash in Hand (Central Cash Balance)',
        amount: cashInHand.totalAmount,
        systemAmount: cashInHand.systemAmount,
        manualAmount: cashInHand.manualAmount,
        lastUpdated: asOfDate,
        note: 'Live net cash balance from central cash flow ledger + manual adjustments',
      },
      {
        id: 'asset-2',
        category: 'Assets',
        particulars: 'Cash in Bank',
        amount: cashInBank.totalAmount,
        systemAmount: cashInBank.systemAmount,
        manualAmount: cashInBank.manualAmount,
        lastUpdated: asOfDate,
        note: 'Bank account holdings + manual bank adjustments',
      },
      {
        id: 'asset-3',
        category: 'Assets',
        particulars: 'Loans Receivable (Customer Outstanding)',
        amount: loansReceivable.totalAmount,
        systemAmount: loansReceivable.systemAmount,
        manualAmount: loansReceivable.manualAmount,
        lastUpdated: asOfDate,
        note: 'SUM of active loan principal balances + manual loan adjustments',
      },
      {
        id: 'asset-4',
        category: 'Assets',
        particulars: 'Active Investment Capital',
        amount: activeInvestment.totalAmount,
        systemAmount: activeInvestment.systemAmount,
        manualAmount: activeInvestment.manualAmount,
        lastUpdated: asOfDate,
        note: 'Direct business capital deployed in Investment Khata + manual adjustments',
      },
      {
        id: 'asset-5',
        category: 'Assets',
        particulars: 'Other Assets (Stamps Inventory & Adjustments)',
        amount: otherAssets.totalAmount,
        systemAmount: otherAssets.systemAmount,
        manualAmount: otherAssets.manualAmount,
        lastUpdated: asOfDate,
        note: 'Physical stamp holdings and document assets + manual adjustments',
      },
      {
        id: 'liab-1',
        category: 'Liabilities',
        particulars: 'Deposits / Amount Payable to Depositors',
        amount: depositsPayable.totalAmount,
        systemAmount: depositsPayable.systemAmount,
        manualAmount: depositsPayable.manualAmount,
        lastUpdated: asOfDate,
        note: 'Total principal payable to active depositors + manual adjustments',
      },
      {
        id: 'liab-2',
        category: 'Liabilities',
        particulars: 'Other Payables',
        amount: otherPayables.totalAmount,
        systemAmount: otherPayables.systemAmount,
        manualAmount: otherPayables.manualAmount,
        lastUpdated: asOfDate,
        note: 'Pending vendor or operational payables + manual adjustments',
      },
      {
        id: 'cap-1',
        category: "Owner's Capital",
        particulars: "Owner's Capital Added",
        amount: totalCapitalAdded.totalAmount,
        systemAmount: totalCapitalAdded.systemAmount,
        manualAmount: totalCapitalAdded.manualAmount,
        lastUpdated: asOfDate,
        note: 'Cumulative direct capital added by owner + manual additions',
      },
      {
        id: 'cap-2',
        category: "Owner's Capital",
        particulars: 'Capital Withdrawn',
        amount: capitalWithdrawn.totalAmount,
        systemAmount: capitalWithdrawn.systemAmount,
        manualAmount: capitalWithdrawn.manualAmount,
        lastUpdated: asOfDate,
        note: 'Cumulative business capital taken out by owner + manual withdrawals',
      },
      {
        id: 'cap-3',
        category: "Owner's Capital",
        particulars: 'Retained Earnings / Accumulated Net Profit',
        amount: retainedEarnings.totalAmount,
        systemAmount: retainedEarnings.systemAmount,
        manualAmount: retainedEarnings.manualAmount,
        lastUpdated: asOfDate,
        note: 'Cumulative net profit retained in business + expense adjustments',
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
      manualEntries: allManualEntries,
    };
  } catch (err) {
    console.error('Error calculating Balance Sheet data:', err);
    const zeroBreakdown: MetricBreakdown = { systemAmount: 0, manualAmount: 0, totalAmount: 0 };
    return {
      asOfDate,
      assets: {
        cashInHand: zeroBreakdown,
        cashInBank: zeroBreakdown,
        loansReceivable: zeroBreakdown,
        activeInvestment: zeroBreakdown,
        otherAssets: zeroBreakdown,
        totalAssets: zeroBreakdown,
      },
      liabilities: {
        depositsPayable: zeroBreakdown,
        otherPayables: zeroBreakdown,
        totalLiabilities: zeroBreakdown,
      },
      ownersCapital: {
        totalCapitalAdded: zeroBreakdown,
        capitalWithdrawn: zeroBreakdown,
        currentOwnerCapital: zeroBreakdown,
        retainedEarnings: zeroBreakdown,
        totalCapitalAndRetained: zeroBreakdown,
      },
      summary: {
        totalAssets: zeroBreakdown,
        totalLiabilities: zeroBreakdown,
        ownersCapitalTotal: zeroBreakdown,
        totalLiabilitiesAndCapital: 0,
        netPosition: zeroBreakdown,
        isBalanced: true,
        difference: 0,
      },
      items: [],
      manualEntries: [],
    };
  }
}

