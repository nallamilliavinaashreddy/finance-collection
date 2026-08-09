import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/types';
import { CustomerFormData } from '@/lib/validations/customer';

/**
 * Helper to log Supabase PostgrestError objects with full structured details
 */
function logSupabaseError(contextMessage: string, error: any) {
  console.error(contextMessage, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    raw: error,
  });
}

// 1. Get Customers from Supabase (Search by customer_id or customer_name)
export async function getCustomers(searchQuery: string = ''): Promise<{ success: boolean; data: Customer[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      // Sanitize double quotes for PostgREST logic tree string matching
      const safeQ = q.replace(/"/g, '\\"');
      // Search by customer_id and customer_name using quoted values to prevent PostgREST PGRST100 parse errors (e.g. spaces/commas)
      query = query.or(`customer_id.ilike."%${safeQ}%",customer_name.ilike."%${safeQ}%"`);
    }

    const { data, error } = await query;

    if (error) {
      logSupabaseError('Supabase getCustomers error:', error);
      const detailsMsg = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : '';
      return { success: false, data: [], error: `${error.message}${detailsMsg}` };
    }

    const formatted: Customer[] = (data || []).map((item: any) => ({
      id: item.id,
      customerId: item.customer_id ?? item.customerId ?? '',
      customerName: item.customer_name ?? item.customerName ?? item.name ?? '',
      mobileNumber: item.mobile_number ?? item.mobileNumber ?? item.phone_number ?? item.phone ?? '',
      address: item.address || undefined,
      createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
      updatedAt: item.updated_at ?? item.updatedAt ?? item.created_at ?? new Date().toISOString(),
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error fetching customers from Supabase:', err);
    return { success: false, data: [], error: err?.message || 'Failed to fetch customers' };
  }
}

// 2. Create Customer in Supabase (Validate Unique customer_id)
export async function createCustomer(formData: CustomerFormData): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const supabase = createClient();
  const trimmedId = formData.customerId.trim();

  try {
    // Unique customer_id check
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('customer_id', trimmedId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      logSupabaseError('Supabase unique check error:', checkError);
    }

    if (existing) {
      return {
        success: false,
        error: `Customer ID "${trimmedId}" already exists. Customer IDs must be unique.`,
      };
    }

    const payload = {
      customer_id: trimmedId,
      customer_name: formData.customerName.trim(),
      mobile_number: formData.mobileNumber.trim(),
      address: formData.address?.trim() || null,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logSupabaseError('Supabase insert customer error:', error);
      const detailsMsg = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : '';
      return { success: false, error: `${error.message}${detailsMsg}` };
    }

    const newCustomer: Customer = {
      id: data.id,
      customerId: data.customer_id ?? data.customerId ?? trimmedId,
      customerName: data.customer_name ?? data.customerName ?? formData.customerName,
      mobileNumber: data.mobile_number ?? data.mobileNumber ?? formData.mobileNumber,
      address: data.address || undefined,
      createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updated_at ?? data.updatedAt ?? new Date().toISOString(),
    };

    return { success: true, data: newCustomer };
  } catch (err: any) {
    console.error('Unexpected error creating customer in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to create customer' };
  }
}

// 3. Update Customer in Supabase
export async function updateCustomer(
  id: string,
  formData: CustomerFormData
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  const supabase = createClient();
  const trimmedId = formData.customerId.trim();

  try {
    // Unique customer_id check against other records
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('customer_id', trimmedId)
      .neq('id', id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      logSupabaseError('Supabase update unique check error:', checkError);
    }

    if (existing) {
      return {
        success: false,
        error: `Customer ID "${trimmedId}" is already assigned to another customer.`,
      };
    }

    const payload = {
      customer_id: trimmedId,
      customer_name: formData.customerName.trim(),
      mobile_number: formData.mobileNumber.trim(),
      address: formData.address?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logSupabaseError('Supabase update customer error:', error);
      const detailsMsg = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : '';
      return { success: false, error: `${error.message}${detailsMsg}` };
    }

    const updatedCustomer: Customer = {
      id: data.id,
      customerId: data.customer_id ?? data.customerId ?? trimmedId,
      customerName: data.customer_name ?? data.customerName ?? formData.customerName,
      mobileNumber: data.mobile_number ?? data.mobileNumber ?? formData.mobileNumber,
      address: data.address || undefined,
      createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updated_at ?? data.updatedAt ?? new Date().toISOString(),
    };

    return { success: true, data: updatedCustomer };
  } catch (err: any) {
    console.error('Unexpected error updating customer in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to update customer' };
  }
}

// 4. Delete Customer from Supabase
export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      logSupabaseError('Supabase delete customer error:', error);
      const detailsMsg = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : '';
      return { success: false, error: `${error.message}${detailsMsg}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting customer from Supabase:', err);
    return { success: false, error: err?.message || 'Failed to delete customer' };
  }
}
