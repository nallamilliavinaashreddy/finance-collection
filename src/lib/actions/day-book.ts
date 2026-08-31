'use server';

import { createClient } from '@/lib/supabase/server';

export interface DayBookTransaction {
  id: string;
  transactionDate: string;
  transactionType: string;
  description: string;
  amountIn: number;
  amountOut: number;
  runningBalance: number;
  referenceType?: string;
  referenceId?: string;
  createdAt?: string;
}

export interface DayBookData {
  selectedDate: string;
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  closingBalance: number;
  transactions: DayBookTransaction[];
}

/**
 * Get Day Book data for a selected date
 * - Opening Balance: Sum of net cash movements (amount_in - amount_out) strictly BEFORE selectedDate
 * - Cash In / Cash Out: Actual money movement on selectedDate (excluding zero-amount accruals)
 * - Running Balance: Updated after each intra-day transaction
 * - Closing Balance: Opening Balance + Total Cash In - Total Cash Out
 */
export async function getDayBookData(
  selectedDateParam?: string
): Promise<{ success: boolean; data?: DayBookData; error?: string }> {
  try {
    const supabase = await createClient();

    const selectedDate = selectedDateParam && selectedDateParam.trim().length === 10
      ? selectedDateParam.trim()
      : new Date().toISOString().split('T')[0];

    // 1. Calculate Opening Balance: Sum of (amount_in - amount_out) for transaction_date < selectedDate
    const { data: priorData, error: priorErr } = await supabase
      .from('investment_transactions')
      .select('amount_in, amount_out')
      .lt('transaction_date', selectedDate);

    if (priorErr) {
      if (priorErr.code === 'PGRST205' || priorErr.code === 'PGRST204' || priorErr.message?.includes('schema cache')) {
        return {
          success: true,
          data: {
            selectedDate,
            openingBalance: 0,
            totalCashIn: 0,
            totalCashOut: 0,
            closingBalance: 0,
            transactions: [],
          },
        };
      }
      return { success: false, error: priorErr.message };
    }

    let rawOpeningBalance = 0;
    (priorData || []).forEach((row: any) => {
      const inAmt = Number(row.amount_in || 0);
      const outAmt = Number(row.amount_out || 0);
      if (inAmt > 0 || outAmt > 0) {
        rawOpeningBalance += (inAmt - outAmt);
      }
    });

    const openingBalance = Math.round(rawOpeningBalance * 100) / 100;

    // 2. Fetch Transactions ON the selected date
    const { data: todayData, error: todayErr } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('transaction_date', selectedDate)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (todayErr) {
      return { success: false, error: todayErr.message };
    }

    // Filter for actual cash movements (amount_in > 0 OR amount_out > 0)
    const cashMovements = (todayData || []).filter((row: any) => {
      const inAmt = Number(row.amount_in || 0);
      const outAmt = Number(row.amount_out || 0);
      return inAmt > 0 || outAmt > 0;
    });

    let totalCashIn = 0;
    let totalCashOut = 0;
    let running = openingBalance;

    const transactions: DayBookTransaction[] = cashMovements.map((row: any) => {
      const inAmt = Math.round(Number(row.amount_in || 0) * 100) / 100;
      const outAmt = Math.round(Number(row.amount_out || 0) * 100) / 100;

      totalCashIn += inAmt;
      totalCashOut += outAmt;
      running = Math.round((running + inAmt - outAmt) * 100) / 100;

      const desc = row.remarks || row.transaction_type || 'Cash Transaction';

      return {
        id: row.id,
        transactionDate: row.transaction_date,
        transactionType: row.transaction_type,
        description: desc,
        amountIn: inAmt,
        amountOut: outAmt,
        runningBalance: running,
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        createdAt: row.created_at,
      };
    });

    totalCashIn = Math.round(totalCashIn * 100) / 100;
    totalCashOut = Math.round(totalCashOut * 100) / 100;
    const closingBalance = Math.round((openingBalance + totalCashIn - totalCashOut) * 100) / 100;

    return {
      success: true,
      data: {
        selectedDate,
        openingBalance,
        totalCashIn,
        totalCashOut,
        closingBalance,
        transactions,
      },
    };
  } catch (err: any) {
    console.error('Unexpected error in getDayBookData:', err);
    return { success: false, error: err?.message || 'Failed to fetch Day Book data' };
  }
}
