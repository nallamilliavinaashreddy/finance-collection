'use client';

import { createClient } from '@/lib/supabase/client';
import { Depositor, DepositorLedger, DepositorMetrics, DepositorStatus } from '@/types';
import { DepositorFormData, DepositorTransactionFormData } from '@/lib/validations/depositor';
import { recordInvestmentTransaction } from '@/lib/actions/investment';

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

const TABLE_MISSING_ERROR =
  'The "depositors" or "depositor_transactions" table does not exist in Supabase yet. Please execute the SQL migration script in supabase/migrations/20260804145300_create_depositors_tables.sql in your Supabase SQL Editor.';

/**
 * 1. Fetch All Depositors with Calculated Balances & Transactions
 */
export async function getDepositors(
  searchQuery?: string,
  statusFilter?: string,
  reportFilter?: string
): Promise<{ success: boolean; data: Depositor[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('depositors')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (reportFilter === 'active') {
      query = query.eq('status', 'active');
    } else if (reportFilter === 'closed') {
      query = query.eq('status', 'closed');
    }

    const { data: depData, error: depErr } = await query;

    if (depErr) {
      if (isTableNotFoundError(depErr)) {
        return { success: true, data: [] };
      }
      console.error('Error fetching depositors:', depErr);
      return { success: false, data: [], error: depErr.message };
    }

    const depositorList = depData || [];
    if (depositorList.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch all depositor transactions to compute outstanding balance & interest paid
    const { data: txData } = await supabase
      .from('depositor_transactions')
      .select('*')
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    const allTx = txData || [];

    let items: Depositor[] = depositorList.map((row: any) => {
      const myTx = allTx.filter((t: any) => t.depositor_id === row.id);

      // Compute total interest paid
      const totalInterestPaid = myTx
        .filter((t: any) => t.transaction_type === 'Interest Paid' || t.transaction_type === 'interest_paid')
        .reduce((sum: number, t: any) => sum + Number(t.amount_out || 0), 0);

      // Compute outstanding principal balance from latest transaction or initial deposit
      let outstandingPrincipal = Number(row.deposit_amount || 0);
      if (myTx.length > 0) {
        const lastTx = myTx[myTx.length - 1];
        outstandingPrincipal = Number(lastTx.outstanding_balance || 0);
      }

      return {
        id: row.id,
        depositorName: row.name || row.depositor_name || '',
        mobileNumber: row.mobile || row.mobile_number || undefined,
        address: row.address || undefined,
        depositAmount: Number(row.deposit_amount || 0),
        monthlyInterestRate: Number(row.monthly_interest_rate || 0),
        annualInterestRate: Number(row.annual_interest_rate || (Number(row.monthly_interest_rate || 0) * 12)),
        interestType: row.interest_type === 'compound' ? 'compound' : 'simple',
        depositDate: row.deposit_date,
        expectedReturnDate: row.expected_return_date || undefined,
        paymentMode: row.payment_mode || 'Bank Transfer',
        outstandingPrincipal,
        totalInterestPaid,
        status: row.status as DepositorStatus,
        remarks: row.remarks || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    if (reportFilter === 'outstanding') {
      items = items.filter((d) => d.outstandingPrincipal > 0);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (dep) =>
          dep.depositorName.toLowerCase().includes(q) ||
          (dep.mobileNumber && dep.mobileNumber.includes(q)) ||
          (dep.address && dep.address.toLowerCase().includes(q)) ||
          (dep.remarks && dep.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: items };
  } catch (err: any) {
    console.error('Unexpected error in getDepositors:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Create New Depositor & Record Initial Transaction
 */
export async function createDepositor(
  formData: DepositorFormData
): Promise<{ success: boolean; data?: Depositor; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      name: formData.depositorName,
      mobile: formData.mobileNumber || null,
      address: formData.address || null,
      deposit_amount: formData.depositAmount,
      monthly_interest_rate: formData.monthlyInterestRate,
      deposit_date: formData.depositDate,
      expected_return_date: formData.expectedReturnDate || null,
      payment_mode: formData.paymentMode,
      remarks: formData.remarks || null,
      status: 'active',
    };

    const { data: depositor, error: depErr } = await supabase
      .from('depositors')
      .insert([payload])
      .select('*')
      .single();

    if (depErr) {
      if (isTableNotFoundError(depErr)) {
        return { success: false, error: TABLE_MISSING_ERROR };
      }
      return { success: false, error: depErr.message };
    }

    // Record initial transaction in depositor_transactions
    const txPayload = {
      depositor_id: depositor.id,
      transaction_date: formData.depositDate,
      transaction_type: 'Deposit Received',
      amount_in: formData.depositAmount,
      amount_out: 0,
      outstanding_balance: formData.depositAmount,
      remarks: `Initial Deposit Received from ${formData.depositorName}${formData.remarks ? ' | ' + formData.remarks : ''}`,
    };

    const { error: txErr } = await supabase.from('depositor_transactions').insert([txPayload]);
    if (txErr && isTableNotFoundError(txErr)) {
      console.warn('depositor_transactions missing:', txErr);
    }

    // Automatically synchronize with central Investment Khata working capital ledger
    await recordInvestmentTransaction(
      'Capital Added',
      formData.depositAmount,
      0,
      'depositor',
      depositor.id,
      `Deposit Received: ${formData.depositorName} (₹${formData.depositAmount} @ ${formData.monthlyInterestRate}%/mo)`,
      formData.depositDate
    );

    const formatted: Depositor = {
      id: depositor.id,
      depositorName: depositor.name || depositor.depositor_name,
      mobileNumber: depositor.mobile || depositor.mobile_number || undefined,
      address: depositor.address || undefined,
      depositAmount: Number(depositor.deposit_amount || 0),
      monthlyInterestRate: Number(depositor.monthly_interest_rate || 0),
      depositDate: depositor.deposit_date,
      expectedReturnDate: depositor.expected_return_date || undefined,
      paymentMode: depositor.payment_mode || 'Bank Transfer',
      outstandingPrincipal: Number(depositor.deposit_amount || 0),
      totalInterestPaid: 0,
      status: depositor.status as DepositorStatus,
      remarks: depositor.remarks || undefined,
      createdAt: depositor.created_at,
      updatedAt: depositor.updated_at,
    };

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Error creating depositor:', err);
    return { success: false, error: err?.message || 'Failed to create depositor' };
  }
}

/**
 * 3. Update Existing Depositor
 */
export async function updateDepositor(
  id: string,
  formData: DepositorFormData
): Promise<{ success: boolean; data?: Depositor; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      name: formData.depositorName,
      mobile: formData.mobileNumber || null,
      address: formData.address || null,
      monthly_interest_rate: formData.monthlyInterestRate,
      deposit_date: formData.depositDate,
      expected_return_date: formData.expectedReturnDate || null,
      payment_mode: formData.paymentMode,
      remarks: formData.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { data: depositor, error } = await supabase
      .from('depositors')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const formatted: Depositor = {
      id: depositor.id,
      depositorName: depositor.name || depositor.depositor_name,
      mobileNumber: depositor.mobile || depositor.mobile_number || undefined,
      address: depositor.address || undefined,
      depositAmount: Number(depositor.deposit_amount || 0),
      monthlyInterestRate: Number(depositor.monthly_interest_rate || 0),
      depositDate: depositor.deposit_date,
      expectedReturnDate: depositor.expected_return_date || undefined,
      paymentMode: depositor.payment_mode || 'Bank Transfer',
      outstandingPrincipal: Number(depositor.deposit_amount || 0),
      totalInterestPaid: 0,
      status: depositor.status as DepositorStatus,
      remarks: depositor.remarks || undefined,
      createdAt: depositor.created_at,
      updatedAt: depositor.updated_at,
    };

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update depositor' };
  }
}

/**
 * 4. Record Depositor Transaction Action (Deposit Received / Interest Paid / Partial Return / Full Return)
 */
export async function recordDepositorTransaction(
  formData: DepositorTransactionFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: depositor, error: fetchErr } = await supabase
      .from('depositors')
      .select('*')
      .eq('id', formData.depositorId)
      .single();

    if (fetchErr || !depositor) {
      if (isTableNotFoundError(fetchErr)) {
        return { success: false, error: TABLE_MISSING_ERROR };
      }
      return { success: false, error: 'Depositor record not found' };
    }

    // Fetch depositor's current outstanding balance from previous transactions
    const { data: txList } = await supabase
      .from('depositor_transactions')
      .select('*')
      .eq('depositor_id', depositor.id)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    let currentBalance = Number(depositor.deposit_amount || 0);
    if (txList && txList.length > 0) {
      currentBalance = Number(txList[txList.length - 1].outstanding_balance || 0);
    }

    const amount = Number(formData.amount || 0);
    let amountIn = 0;
    let amountOut = 0;
    let newBalance = currentBalance;
    let formattedType = 'Interest Paid';
    let newStatus: DepositorStatus = depositor.status as DepositorStatus;

    if (formData.transactionType === 'deposit_received') {
      formattedType = 'Deposit Received';
      amountIn = amount;
      amountOut = 0;
      newBalance = currentBalance + amount;
      newStatus = 'active';

      // Sync Investment Khata (Increases working capital)
      await recordInvestmentTransaction(
        'Capital Added',
        amountIn,
        0,
        'depositor_add',
        depositor.id,
        `Subsequent Deposit Received: ${depositor.name || depositor.depositor_name} (₹${amount})${formData.remarks ? ' | ' + formData.remarks : ''}`,
        formData.transactionDate
      );
    } else if (formData.transactionType === 'interest_paid') {
      formattedType = 'Interest Paid';
      amountIn = 0;
      amountOut = amount;
      newBalance = currentBalance; // Interest payment does not reduce principal
      newStatus = depositor.status;

      // Sync Investment Khata (Decreases working capital as operating interest expense)
      await recordInvestmentTransaction(
        'Expense',
        0,
        amountOut,
        'depositor_interest',
        depositor.id,
        `Depositor Interest Paid: ${depositor.name || depositor.depositor_name} (₹${amount})${formData.remarks ? ' | ' + formData.remarks : ''}`,
        formData.transactionDate
      );
    } else if (formData.transactionType === 'partial_return') {
      formattedType = 'Partial Return';
      amountIn = 0;
      amountOut = amount;
      newBalance = Math.max(0, currentBalance - amount);
      newStatus = newBalance <= 0 ? 'closed' : 'active';

      // Sync Investment Khata (Decreases working capital)
      await recordInvestmentTransaction(
        'Capital Returned',
        0,
        amountOut,
        'depositor_principal_return',
        depositor.id,
        `Partial Principal Returned to Depositor: ${depositor.name || depositor.depositor_name} (₹${amount})${formData.remarks ? ' | ' + formData.remarks : ''}`,
        formData.transactionDate
      );
    } else if (formData.transactionType === 'full_return') {
      formattedType = 'Full Return';
      amountIn = 0;
      amountOut = currentBalance;
      newBalance = 0;
      newStatus = 'closed';

      // Sync Investment Khata (Decreases working capital)
      await recordInvestmentTransaction(
        'Capital Returned',
        0,
        amountOut,
        'depositor_principal_return',
        depositor.id,
        `Full Principal Returned & Settled: ${depositor.name || depositor.depositor_name} (₹${amountOut})${formData.remarks ? ' | ' + formData.remarks : ''}`,
        formData.transactionDate
      );
    }

    // Insert into depositor_transactions
    const txPayload = {
      depositor_id: depositor.id,
      transaction_date: formData.transactionDate,
      transaction_type: formattedType,
      amount_in: amountIn,
      amount_out: amountOut,
      outstanding_balance: newBalance,
      remarks: formData.remarks || null,
    };

    const { error: txErr } = await supabase
      .from('depositor_transactions')
      .insert([txPayload]);

    if (txErr) {
      console.error('Error inserting depositor transaction:', txErr);
      return { success: false, error: txErr.message };
    }

    // Update status on depositors table if closed
    if (newStatus !== depositor.status) {
      await supabase
        .from('depositors')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', depositor.id);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error recording depositor transaction:', err);
    return { success: false, error: err?.message || 'Failed to record depositor transaction' };
  }
}

/**
 * 5. Get Individual Depositor Transaction History
 */
export async function getDepositorLedger(
  depositorId?: string
): Promise<{ success: boolean; data: DepositorLedger[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('depositor_transactions')
      .select('*, depositors(name, depositor_name)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (depositorId) {
      query = query.eq('depositor_id', depositorId);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    const items: DepositorLedger[] = (data || []).map((row: any) => {
      const dep = row.depositors || {};
      const txType = row.transaction_type;

      let normalizedType: any = 'interest_paid';
      if (txType === 'Deposit Received' || txType === 'deposit_received') normalizedType = 'deposit_received';
      else if (txType === 'Interest Paid' || txType === 'interest_paid') normalizedType = 'interest_paid';
      else if (txType === 'Partial Return' || txType === 'partial_return') normalizedType = 'partial_return';
      else if (txType === 'Full Return' || txType === 'full_return') normalizedType = 'full_return';

      const amountIn = Number(row.amount_in || 0);
      const amountOut = Number(row.amount_out || 0);
      const closingBalance = Number(row.outstanding_balance || 0);
      const openingBalance = closingBalance + amountOut - amountIn;

      return {
        id: row.id,
        depositorId: row.depositor_id,
        depositorName: dep.name || dep.depositor_name || 'N/A',
        transactionDate: row.transaction_date,
        transactionType: normalizedType,
        openingBalance: Math.max(0, openingBalance),
        amountIn,
        amountOut,
        principalPaid: normalizedType === 'partial_return' || normalizedType === 'full_return' ? amountOut : 0,
        interestPaid: normalizedType === 'interest_paid' ? amountOut : 0,
        closingBalance,
        remarks: row.remarks || undefined,
        createdAt: row.created_at,
      };
    });

    return { success: true, data: items };
  } catch (err: any) {
    console.error('Error fetching depositor ledger:', err);
    return { success: true, data: [] };
  }
}

/**
 * 6. Close Depositor
 */
export async function closeDepositor(
  depositorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('depositors')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', depositorId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to close depositor' };
  }
}

/**
 * 7. Delete Depositor
 */
export async function deleteDepositor(
  depositorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('depositors')
      .delete()
      .eq('id', depositorId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete depositor' };
  }
}

/**
 * 8. Get Depositor Metrics Summary
 */
export async function getDepositorMetrics(): Promise<{
  success: boolean;
  data: DepositorMetrics;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const [depRes, txRes] = await Promise.all([
      supabase.from('depositors').select('*'),
      supabase.from('depositor_transactions').select('*'),
    ]);

    if (depRes.error) {
      if (isTableNotFoundError(depRes.error)) {
        return {
          success: true,
          data: {
            totalDepositedAmount: 0,
            activeDepositors: 0,
            outstandingDepositBalance: 0,
            monthlyInterestPayable: 0,
            totalInterestPaid: 0,
            closedDeposits: 0,
          },
        };
      }
    }

    const depositors = depRes.data || [];
    const allTx = txRes.data || [];

    const totalDepositedAmount = depositors.reduce(
      (sum: number, d: any) => sum + Number(d.deposit_amount || 0),
      0
    );

    const activeDepositors = depositors.filter((d: any) => d.status === 'active').length;
    const closedDeposits = depositors.filter((d: any) => d.status === 'closed').length;

    // Calculate outstanding balance & interest paid per depositor
    let outstandingDepositBalance = 0;
    let monthlyInterestPayable = 0;
    let totalInterestPaid = 0;

    for (const d of depositors) {
      const myTx = allTx.filter((t: any) => t.depositor_id === d.id);

      const paid = myTx
        .filter((t: any) => t.transaction_type === 'Interest Paid' || t.transaction_type === 'interest_paid')
        .reduce((sum: number, t: any) => sum + Number(t.amount_out || 0), 0);

      totalInterestPaid += paid;

      let bal = Number(d.deposit_amount || 0);
      if (myTx.length > 0) {
        bal = Number(myTx[myTx.length - 1].outstanding_balance || 0);
      }

      if (d.status === 'active') {
        outstandingDepositBalance += bal;
        const rate = Number(d.monthly_interest_rate || 0);
        monthlyInterestPayable += (bal * rate) / 100;
      }
    }

    return {
      success: true,
      data: {
        totalDepositedAmount: Math.round(totalDepositedAmount * 100) / 100,
        activeDepositors,
        outstandingDepositBalance: Math.round(outstandingDepositBalance * 100) / 100,
        monthlyInterestPayable: Math.round(monthlyInterestPayable * 100) / 100,
        totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
        closedDeposits,
      },
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        totalDepositedAmount: 0,
        activeDepositors: 0,
        outstandingDepositBalance: 0,
        monthlyInterestPayable: 0,
        totalInterestPaid: 0,
        closedDeposits: 0,
      },
    };
  }
}
