import { createClient } from '@/lib/supabase/client';
import { Stamp, StampMetrics } from '@/types';
import { StampFormData } from '@/lib/validations/stamp';
import {
  recordInvestmentTransaction,
  updateInvestmentTransactionByReference,
  deleteInvestmentTransactionByReference,
} from '@/lib/actions/investment';
import { getMonthDateRange } from '@/lib/utils';

/**
 * 1. Get Stamps with JOIN on customers
 */
export async function getStamps(
  searchQuery: string = '',
  customerIdFilter: string = 'all',
  stampTypeFilter: string = 'all',
  startDateFilter?: string,
  endDateFilter?: string
): Promise<{ success: boolean; data: Stamp[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('stamps')
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .order('stamp_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (customerIdFilter && customerIdFilter !== 'all') {
      query = query.eq('customer_id', customerIdFilter);
    }

    if (stampTypeFilter && stampTypeFilter !== 'all') {
      query = query.eq('stamp_type', stampTypeFilter);
    }

    if (startDateFilter) {
      query = query.gte('stamp_date', startDateFilter);
    }

    if (endDateFilter) {
      query = query.lte('stamp_date', endDateFilter);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: stamps table missing in schema cache, returning empty list.');
        return { success: true, data: [] };
      }
      console.error('Supabase getStamps query error:', error);
      return { success: false, data: [], error: error.message };
    }

    let formatted: Stamp[] = (data || []).map((item: any) => {
      const cust = item.customers || {};
      return {
        id: item.id,
        customerId: item.customer_id,
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        loanId: item.loan_id || undefined,
        stampDate: item.stamp_date,
        stampType: item.stamp_type,
        stampNumber: item.stamp_number || undefined,
        amount: Number(item.amount || 0),
        vendor: item.vendor || undefined,
        remarks: item.remarks || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      formatted = formatted.filter(
        (s) =>
          (s.stampNumber && s.stampNumber.toLowerCase().includes(q)) ||
          (s.vendor && s.vendor.toLowerCase().includes(q)) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.customerCode && s.customerCode.toLowerCase().includes(q)) ||
          s.stampType.toLowerCase().includes(q) ||
          (s.remarks && s.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getStamps:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Create Stamp Record
 */
export async function createStamp(
  formData: StampFormData
): Promise<{ success: boolean; data?: Stamp; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      customer_id: formData.customerId,
      loan_id: formData.loanId || null,
      stamp_date: formData.stampDate,
      stamp_type: formData.stampType,
      stamp_number: formData.stampNumber || null,
      amount: formData.amount,
      vendor: formData.vendor || null,
      remarks: formData.remarks || null,
    };

    const { data, error } = await supabase
      .from('stamps')
      .insert([payload])
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: stamps table missing in schema cache.');
        return {
          success: false,
          error: 'The "stamps" database table needs to be created in Supabase SQL editor first.',
        };
      }
      console.error('Supabase createStamp error:', error);
      return { success: false, error: error.message };
    }

    const cust = data.customers || {};
    const newStamp: Stamp = {
      id: data.id,
      customerId: data.customer_id,
      customerCode: cust.customer_id || 'N/A',
      customerName: cust.customer_name || 'Customer',
      loanId: data.loan_id || undefined,
      stampDate: data.stamp_date,
      stampType: data.stamp_type,
      stampNumber: data.stamp_number || undefined,
      amount: Number(data.amount || 0),
      vendor: data.vendor || undefined,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Automatically record stamp income in Investment Khata if Stamp Amount > 0
    if (formData.amount > 0) {
      try {
        await recordInvestmentTransaction(
          'Stamp Income',
          formData.amount,
          0,
          'stamp',
          data.id,
          `Stamp Income: ${formData.stampType} for ${cust.customer_name || 'Customer'}`,
          formData.stampDate
        );
      } catch (invErr) {
        console.warn('Investment Khata stamp hook notice:', invErr);
      }
    }

    return { success: true, data: newStamp };
  } catch (err: any) {
    console.error('Unexpected error creating stamp:', err);
    return { success: false, error: err?.message || 'Failed to create stamp record' };
  }
}

/**
 * 3. Update Stamp Record
 */
export async function updateStamp(
  id: string,
  formData: StampFormData
): Promise<{ success: boolean; data?: Stamp; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      customer_id: formData.customerId,
      loan_id: formData.loanId || null,
      stamp_date: formData.stampDate,
      stamp_type: formData.stampType,
      stamp_number: formData.stampNumber || null,
      amount: formData.amount,
      vendor: formData.vendor || null,
      remarks: formData.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('stamps')
      .update(payload)
      .eq('id', id)
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .single();

    if (error) {
      console.error('Supabase updateStamp error:', error);
      return { success: false, error: error.message };
    }

    const cust = data.customers || {};
    const updatedStamp: Stamp = {
      id: data.id,
      customerId: data.customer_id,
      customerCode: cust.customer_id || 'N/A',
      customerName: cust.customer_name || 'Customer',
      loanId: data.loan_id || undefined,
      stampDate: data.stamp_date,
      stampType: data.stamp_type,
      stampNumber: data.stamp_number || undefined,
      amount: Number(data.amount || 0),
      vendor: data.vendor || undefined,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Automatically update corresponding Investment transaction
    if (formData.amount > 0) {
      try {
        await updateInvestmentTransactionByReference(
          'stamp',
          id,
          formData.amount,
          0,
          `Stamp Income: ${formData.stampType} for ${cust.customer_name || 'Customer'}`,
          formData.stampDate
        );
      } catch (invErr) {
        console.warn('Investment Khata update stamp hook notice:', invErr);
      }
    } else {
      // If Stamp Amount is changed to 0, delete the Stamp Income transaction & recalculate balances
      try {
        await deleteInvestmentTransactionByReference('stamp', id);
      } catch (invErr) {
        console.warn('Investment Khata delete stamp hook notice:', invErr);
      }
    }

    return { success: true, data: updatedStamp };
  } catch (err: any) {
    console.error('Unexpected error updating stamp:', err);
    return { success: false, error: err?.message || 'Failed to update stamp record' };
  }
}

/**
 * 4. Delete Stamp Record
 */
export async function deleteStamp(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('stamps').delete().eq('id', id);

    if (error) {
      console.error('Supabase deleteStamp error:', error);
      return { success: false, error: error.message };
    }

    // Automatically delete corresponding Investment transaction & recalculate ledger
    try {
      await deleteInvestmentTransactionByReference('stamp', id);
    } catch (invErr) {
      console.warn('Investment Khata delete stamp hook notice:', invErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting stamp:', err);
    return { success: false, error: err?.message || 'Failed to delete stamp record' };
  }
}

/**
 * 5. Get Stamp Metrics (Today's Stamp Income & This Month Stamp Income)
 */
export async function getStampMetrics(): Promise<{
  success: boolean;
  data: StampMetrics;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];
    const { monthStart, monthEnd } = getMonthDateRange(todayISO);

    const { data, error } = await supabase.from('stamps').select('*');

    if (error) {
      return {
        success: true,
        data: { todaysStampIncome: 0, thisMonthsStampIncome: 0, totalStampIncome: 0 },
      };
    }

    const allStamps = data || [];
    const todaysStampIncome = allStamps
      .filter((s: any) => s.stamp_date === todayISO)
      .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);

    const thisMonthsStampIncome = allStamps
      .filter((s: any) => s.stamp_date >= monthStart && s.stamp_date <= monthEnd)
      .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);

    const totalStampIncome = allStamps.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);

    return {
      success: true,
      data: {
        todaysStampIncome,
        thisMonthsStampIncome,
        totalStampIncome,
      },
    };
  } catch (err: any) {
    console.error('Error fetching stamp metrics:', err);
    return {
      success: true,
      data: {
        todaysStampIncome: 0,
        thisMonthsStampIncome: 0,
        totalStampIncome: 0,
      },
    };
  }
}
