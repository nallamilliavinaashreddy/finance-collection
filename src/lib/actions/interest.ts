import { createClient } from '@/lib/supabase/client';
import { InterestTransaction, InterestMetrics, InterestType } from '@/types';
import { getMonthDateRange, getWeekDateRange } from '@/lib/utils';
import { formatSupabaseError } from '@/lib/actions/investment';

/**
 * Safely parse PostgREST missing table errors
 */
function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return code === 'PGRST205' || msg.includes('relation') || msg.includes('does not exist') || msg.includes('cache');
}

/**
 * 1. Record an interest transaction (automated hook when collection is created)
 */
export async function recordInterestTransaction(payload: {
  collectionId?: string;
  loanId: string;
  customerId: string;
  transactionDate: string;
  interestType: InterestType;
  interestAmount: number;
  remarks?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    if (payload.interestAmount <= 0) {
      return { success: true };
    }

    const { error } = await supabase.from('interest_transactions').insert([
      {
        collection_id: payload.collectionId || null,
        loan_id: payload.loanId,
        customer_id: payload.customerId,
        transaction_date: payload.transactionDate,
        interest_type: payload.interestType,
        interest_amount: payload.interestAmount,
        remarks: payload.remarks || null,
      },
    ]);

    if (error) {
      if (isTableNotFoundError(error)) {
        console.warn('Notice: interest_transactions table not initialized in Supabase SQL editor.');
        return { success: true };
      }
      return { success: false, error: formatSupabaseError(error) };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Interest transaction helper caught error:', err);
    return { success: true };
  }
}

/**
 * 2. Delete interest transaction by collectionId (automated hook when collection is deleted)
 */
export async function deleteInterestTransactionByCollectionId(collectionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('interest_transactions')
      .delete()
      .eq('collection_id', collectionId);

    if (error && !isTableNotFoundError(error)) {
      console.warn('Error deleting interest transaction for collection:', collectionId, error);
    }
    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}

/**
 * 3. Get Interest Transactions (Ledger Feed with Filters)
 */
export async function getInterestTransactions(
  searchQuery: string = '',
  typeFilter: string = 'all',
  dateFilter: string = 'all',
  startDate?: string,
  endDate?: string,
  customerId?: string
): Promise<{ success: boolean; data: InterestTransaction[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('interest_transactions')
      .select('*, customers(id, customer_id, customer_name)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Interest Type Filter
    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('interest_type', typeFilter);
    }

    // Customer Filter
    if (customerId && customerId !== 'all') {
      query = query.eq('customer_id', customerId);
    }

    // Date Range Filters
    const todayISO = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      query = query.eq('transaction_date', todayISO);
    } else if (dateFilter === 'thisWeek') {
      const { weekStart, weekEnd } = getWeekDateRange(todayISO);
      query = query.gte('transaction_date', weekStart).lte('transaction_date', weekEnd);
    } else if (dateFilter === 'thisMonth') {
      const { monthStart, monthEnd } = getMonthDateRange(todayISO);
      query = query.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: formatSupabaseError(error) };
    }

    let items: InterestTransaction[] = (data || []).map((row: any) => {
      const cust = row.customers || {};
      return {
        id: row.id,
        collectionId: row.collection_id || undefined,
        loanId: row.loan_id,
        customerId: row.customer_id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        transactionDate: row.transaction_date,
        interestType: row.interest_type as InterestType,
        interestAmount: Number(row.interest_amount || 0),
        remarks: row.remarks || undefined,
        createdAt: row.created_at,
      };
    });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.customerName?.toLowerCase().includes(q) ||
          item.customerCode?.toLowerCase().includes(q) ||
          item.interestType.toLowerCase().includes(q) ||
          (item.remarks && item.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: items };
  } catch (err: any) {
    return { success: true, data: [] };
  }
}

/**
 * 4. Get Interest Metrics Summary (5 Dashboard Cards)
 */
export async function getInterestMetrics(
  dateFilter: string = 'all',
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data: InterestMetrics; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase.from('interest_transactions').select('interest_type, interest_amount, transaction_date');

    const todayISO = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      query = query.eq('transaction_date', todayISO);
    } else if (dateFilter === 'thisWeek') {
      const { weekStart, weekEnd } = getWeekDateRange(todayISO);
      query = query.gte('transaction_date', weekStart).lte('transaction_date', weekEnd);
    } else if (dateFilter === 'thisMonth') {
      const { monthStart, monthEnd } = getMonthDateRange(todayISO);
      query = query.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: true,
        data: {
          dailyInterest: 0,
          weeklyInterest: 0,
          monthlyInterest: 0,
          adjustmentInterest: 0,
          totalInterestCollected: 0,
        },
      };
    }

    const items = data || [];

    const dailyInterest = items
      .filter((i: any) => i.interest_type === 'daily')
      .reduce((sum: number, i: any) => sum + Number(i.interest_amount || 0), 0);

    const weeklyInterest = items
      .filter((i: any) => i.interest_type === 'weekly')
      .reduce((sum: number, i: any) => sum + Number(i.interest_amount || 0), 0);

    const monthlyInterest = items
      .filter((i: any) => i.interest_type === 'monthly')
      .reduce((sum: number, i: any) => sum + Number(i.interest_amount || 0), 0);

    const adjustmentInterest = items
      .filter((i: any) => i.interest_type === 'adjustment')
      .reduce((sum: number, i: any) => sum + Number(i.interest_amount || 0), 0);

    const totalInterestCollected = dailyInterest + weeklyInterest + monthlyInterest + adjustmentInterest;

    return {
      success: true,
      data: {
        dailyInterest: Math.round(dailyInterest * 100) / 100,
        weeklyInterest: Math.round(weeklyInterest * 100) / 100,
        monthlyInterest: Math.round(monthlyInterest * 100) / 100,
        adjustmentInterest: Math.round(adjustmentInterest * 100) / 100,
        totalInterestCollected: Math.round(totalInterestCollected * 100) / 100,
      },
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        dailyInterest: 0,
        weeklyInterest: 0,
        monthlyInterest: 0,
        adjustmentInterest: 0,
        totalInterestCollected: 0,
      },
    };
  }
}
