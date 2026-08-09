import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseMetrics } from '@/types';
import { ExpenseFormData } from '@/lib/validations/expense';
import { recordInvestmentTransaction } from '@/lib/actions/investment';
import { getMonthDateRange } from '@/lib/utils';

/**
 * 1. Get Expenses from Supabase with search, category & date filters
 */
export async function getExpenses(
  searchQuery: string = '',
  categoryFilter: string = 'all',
  startDateFilter?: string,
  endDateFilter?: string
): Promise<{ success: boolean; data: Expense[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false });

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    if (startDateFilter) {
      query = query.gte('expense_date', startDateFilter);
    }

    if (endDateFilter) {
      query = query.lte('expense_date', endDateFilter);
    }

    const { data, error } = await query;

    if (error) {
      // Catch missing table in schema cache (PGRST205/404) gracefully
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: expenses table missing in schema cache, returning empty list.');
        return { success: true, data: [] };
      }
      console.error('Supabase getExpenses query error:', error);
      return { success: false, data: [], error: error.message };
    }

    let formatted: Expense[] = (data || []).map((item: any) => ({
      id: item.id,
      expenseDate: item.expense_date,
      category: item.category,
      amount: Number(item.amount || 0),
      description: item.description,
      paidTo: item.paid_to || undefined,
      paymentMode: item.payment_mode || 'Cash',
      remarks: item.remarks || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      formatted = formatted.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q) ||
          e.paymentMode.toLowerCase().includes(q) ||
          (e.remarks && e.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getExpenses:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Create Expense in Supabase
 */
export async function createExpense(
  formData: ExpenseFormData
): Promise<{ success: boolean; data?: Expense; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      expense_date: formData.expenseDate,
      category: formData.category,
      amount: formData.amount,
      description: formData.description,
      paid_to: formData.paidTo || null,
      payment_mode: formData.paymentMode,
      remarks: formData.remarks || null,
    };

    const { data, error } = await supabase.from('expenses').insert([payload]).select('*').single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: expenses table missing in schema cache. Run schema.sql in Supabase SQL editor.');
        return {
          success: false,
          error: 'The "expenses" database table needs to be created in Supabase SQL editor first.',
        };
      }
      console.error('Supabase createExpense error:', error);
      return { success: false, error: error.message };
    }

    const newExpense: Expense = {
      id: data.id,
      expenseDate: data.expense_date,
      category: data.category,
      amount: Number(data.amount || 0),
      description: data.description,
      paidTo: data.paid_to || undefined,
      paymentMode: data.payment_mode,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Automatically record expense in Investment Khata
    try {
      await recordInvestmentTransaction(
        'Expense',
        0,
        formData.amount,
        'expense',
        data.id,
        `Expense: ${formData.category} - ${formData.description}`,
        formData.expenseDate
      );
    } catch (invErr) {
      console.warn('Investment Khata expense hook notice:', invErr);
    }

    return { success: true, data: newExpense };
  } catch (err: any) {
    console.error('Unexpected error creating expense:', err);
    return { success: false, error: err?.message || 'Failed to create expense' };
  }
}

/**
 * 3. Update Expense in Supabase
 */
export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<{ success: boolean; data?: Expense; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      expense_date: formData.expenseDate,
      category: formData.category,
      amount: formData.amount,
      description: formData.description,
      paid_to: formData.paidTo || null,
      payment_mode: formData.paymentMode,
      remarks: formData.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase updateExpense error:', error);
      return { success: false, error: error.message };
    }

    const updatedExpense: Expense = {
      id: data.id,
      expenseDate: data.expense_date,
      category: data.category,
      amount: Number(data.amount || 0),
      description: data.description,
      paidTo: data.paid_to || undefined,
      paymentMode: data.payment_mode,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: updatedExpense };
  } catch (err: any) {
    console.error('Unexpected error updating expense:', err);
    return { success: false, error: err?.message || 'Failed to update expense' };
  }
}

/**
 * 4. Delete Expense from Supabase
 */
export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Supabase deleteExpense error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting expense:', err);
    return { success: false, error: err?.message || 'Failed to delete expense' };
  }
}

/**
 * 5. Get Expense Metrics (Today's Expenses & This Month Expenses)
 */
export async function getExpenseMetrics(): Promise<{
  success: boolean;
  data: ExpenseMetrics;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];
    const { monthStart, monthEnd } = getMonthDateRange(todayISO);

    const { data, error } = await supabase.from('expenses').select('*');

    if (error) {
      return {
        success: true,
        data: { todaysExpenses: 0, thisMonthsExpenses: 0, totalExpenses: 0 },
      };
    }

    const allExp = data || [];
    const todaysExpenses = allExp
      .filter((e: any) => e.expense_date === todayISO)
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    const thisMonthsExpenses = allExp
      .filter((e: any) => e.expense_date >= monthStart && e.expense_date <= monthEnd)
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    const totalExpenses = allExp.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    return {
      success: true,
      data: {
        todaysExpenses,
        thisMonthsExpenses,
        totalExpenses,
      },
    };
  } catch (err: any) {
    console.error('Error fetching expense metrics:', err);
    return {
      success: true,
      data: { todaysExpenses: 0, thisMonthsExpenses: 0, totalExpenses: 0 },
    };
  }
}
