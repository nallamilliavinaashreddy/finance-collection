import { createClient } from '@/lib/supabase/client';
import { Chit, ChitPayment, ChitMetrics } from '@/types';
import { ChitFormData, ChitPaymentFormData } from '@/lib/validations/chit';
import {
  recordInvestmentTransaction,
  updateInvestmentTransactionByReference,
  deleteInvestmentTransactionByReference,
} from '@/lib/actions/investment';
import { getMonthDateRange } from '@/lib/utils';

/**
 * Synchronize Chit Net Profit / Net Loss accounting entries into Central Cash Flow / Investment Khata.
 * - Called automatically when a chit is created, updated, payment added/deleted, or prize recorded/deleted.
 * - Only records Profit/Loss when status is 'completed' or 'closed'.
 * - If status is 'active' or if completed status is reversed, any posted profit/loss ledger entry is removed.
 * - Prevents duplicate entries by using reference_type ('chit_profit' / 'chit_loss') and reference_id (chit.id).
 */
export async function syncChitProfitLossAccounting(
  chitId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: chit, error: chitErr } = await supabase
      .from('chits')
      .select('*')
      .eq('id', chitId)
      .single();

    if (chitErr || !chit) {
      return { success: true };
    }

    const totalM = Number(chit.total_months || 50);
    const paidM = Number(chit.paid_months || 0);
    const isCompletedOrClosed = chit.status === 'completed' || chit.status === 'closed' || paidM >= totalM;

    if (!isCompletedOrClosed) {
      // Reversed or Active: Remove any existing profit or loss entries
      await deleteInvestmentTransactionByReference('chit_profit', chitId);
      await deleteInvestmentTransactionByReference('chit_loss', chitId);
      return { success: true };
    }

    // 1. Calculate Total Investment (all payments made for this chit)
    const { data: payments } = await supabase
      .from('chit_payments')
      .select('amount')
      .eq('chit_id', chitId);

    const actualPaymentsSum = (payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );
    const totalInvestment = Math.max(actualPaymentsSum, Number(chit.total_paid || 0));
    const totalInvestmentRounded = Math.round(totalInvestment * 100) / 100;

    // 2. Calculate Total Received (prize amount received)
    const { data: prizeTx } = await supabase
      .from('investment_transactions')
      .select('amount_in, transaction_date')
      .eq('reference_type', 'chit_prize')
      .eq('reference_id', chitId)
      .maybeSingle();

    let totalReceived = 0;
    let txDate = chit.prize_date || chit.updated_at || new Date().toISOString().split('T')[0];

    if (prizeTx && Number(prizeTx.amount_in || 0) > 0) {
      totalReceived = Number(prizeTx.amount_in || 0);
      if (prizeTx.transaction_date) txDate = prizeTx.transaction_date;
    } else if (chit.prize_amount && Number(chit.prize_amount) > 0) {
      totalReceived = Number(chit.prize_amount);
    }

    const totalReceivedRounded = Math.round(totalReceived * 100) / 100;

    // 3. Calculate Net Result
    const netResult = Math.round((totalReceivedRounded - totalInvestmentRounded) * 100) / 100;
    const chitRef = `${chit.chit_company} (${chit.group_number})`;

    if (netResult > 0) {
      // PROFIT: Post net positive difference to Investment Khata
      await deleteInvestmentTransactionByReference('chit_loss', chitId);
      await updateInvestmentTransactionByReference(
        'chit_profit',
        chitId,
        netResult,
        0,
        `Chit Profit - ${chitRef}`,
        txDate
      );
    } else if (netResult < 0) {
      // LOSS: Post net negative difference to Investment Khata
      const lossVal = Math.abs(netResult);
      await deleteInvestmentTransactionByReference('chit_profit', chitId);
      await updateInvestmentTransactionByReference(
        'chit_loss',
        chitId,
        0,
        lossVal,
        `Chit Loss - ${chitRef}`,
        txDate
      );
    } else {
      // BREAK EVEN: Remove any profit or loss transaction
      await deleteInvestmentTransactionByReference('chit_profit', chitId);
      await deleteInvestmentTransactionByReference('chit_loss', chitId);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Notice: Error syncing chit profit/loss accounting:', chitId, err);
    return { success: true };
  }
}

/**
 * 1. Get Chits list
 */
export async function getChits(
  searchQuery: string = '',
  statusFilter: string = 'all',
  startDateFilter?: string,
  endDateFilter?: string
): Promise<{ success: boolean; data: Chit[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('chits')
      .select('*')
      .order('status', { ascending: true })
      .order('next_due_date', { ascending: true });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (startDateFilter) {
      query = query.gte('start_date', startDateFilter);
    }

    if (endDateFilter) {
      query = query.lte('start_date', endDateFilter);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        console.warn('Notice: chits table missing in schema cache, returning empty list.');
        return { success: true, data: [] };
      }
      console.error('Supabase getChits query error:', error);
      return { success: false, data: [], error: error.message };
    }

    // Query prize transactions from investment_transactions table
    const { data: prizeData } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('reference_type', 'chit_prize');

    const prizeMap = new Map<string, { amount: number; date: string }>();
    (prizeData || []).forEach((row: any) => {
      if (row.reference_id && Number(row.amount_in || 0) > 0) {
        prizeMap.set(String(row.reference_id), {
          amount: Number(row.amount_in || 0),
          date: row.transaction_date,
        });
      }
    });

    let formatted: Chit[] = (data || []).map((item: any) => {
      const totMonths = Number(item.total_months || 50);
      const pdMonths = Number(item.paid_months || 0);
      const remainingInst = Math.max(0, totMonths - pdMonths);
      const isCompleted = pdMonths >= totMonths;

      const pInfo = prizeMap.get(item.id);
      const pTaken = Boolean((pInfo && pInfo.amount > 0) || item.prize_taken);
      const pAmount = pInfo ? pInfo.amount : Number(item.prize_amount || 0);
      const pDate = pInfo ? pInfo.date : item.prize_date || undefined;

      const totalInvestment = Math.round(Number(item.total_paid || 0) * 100) / 100;
      const totalReceived = Math.round(pAmount * 100) / 100;
      const principalRecovered = Math.round(Math.min(totalInvestment, totalReceived) * 100) / 100;
      const netResult = Math.round((totalReceived - totalInvestment) * 100) / 100;

      let resultStatus: 'profit' | 'loss' | 'break_even' = 'break_even';
      if (netResult > 0) resultStatus = 'profit';
      else if (netResult < 0) resultStatus = 'loss';

      const profitAmount = netResult > 0 ? netResult : 0;
      const lossAmount = netResult < 0 ? Math.abs(netResult) : 0;

      const finalStatus = isCompleted ? 'completed' : (item.status || 'active');

      return {
        id: item.id,
        chitCompany: item.chit_company,
        groupNumber: item.group_number,
        chitValue: Number(item.chit_value || 0),
        monthlyInstallment: Number(item.monthly_installment || 0),
        totalMonths: totMonths,
        paidMonths: pdMonths,
        remainingInstallments: remainingInst,
        totalPaid: Number(item.total_paid || 0),
        prizeTaken: pTaken,
        prizeAmount: pAmount,
        prizeDate: pDate,
        startDate: item.start_date,
        nextDueDate: item.next_due_date,
        status: finalStatus,
        remarks: item.remarks || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Profit / Loss Integration
        totalInvestment,
        totalReceived,
        principalRecovered,
        netResult,
        resultStatus,
        profitAmount,
        lossAmount,
      };
    });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      formatted = formatted.filter(
        (c) =>
          c.chitCompany.toLowerCase().includes(q) ||
          c.groupNumber.toLowerCase().includes(q) ||
          (c.remarks && c.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getChits:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Create Chit Subscription
 */
export async function createChit(
  formData: ChitFormData
): Promise<{ success: boolean; data?: Chit; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      chit_company: formData.chitCompany,
      group_number: formData.groupNumber,
      chit_value: formData.chitValue,
      monthly_installment: formData.monthlyInstallment,
      total_months: formData.totalMonths,
      paid_months: 0,
      total_paid: 0,
      start_date: formData.startDate,
      next_due_date: formData.nextDueDate,
      status: formData.status || 'active',
      remarks: formData.remarks || null,
    };

    const { data, error } = await supabase.from('chits').insert([payload]).select('*').single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        return {
          success: false,
          error: 'The "chits" database table needs to be created in Supabase SQL editor first.',
        };
      }
      console.error('Supabase createChit error:', error);
      return { success: false, error: error.message };
    }

    const totalM = Number(data.total_months || 50);
    const paidM = Number(data.paid_months || 0);

    const newChit: Chit = {
      id: data.id,
      chitCompany: data.chit_company,
      groupNumber: data.group_number,
      chitValue: Number(data.chit_value || 0),
      monthlyInstallment: Number(data.monthly_installment || 0),
      totalMonths: totalM,
      paidMonths: paidM,
      remainingInstallments: Math.max(0, totalM - paidM),
      totalPaid: Number(data.total_paid || 0),
      prizeTaken: false,
      prizeAmount: 0,
      startDate: data.start_date,
      nextDueDate: data.next_due_date,
      status: data.status,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    await syncChitProfitLossAccounting(data.id);

    return { success: true, data: newChit };
  } catch (err: any) {
    console.error('Unexpected error creating chit:', err);
    return { success: false, error: err?.message || 'Failed to create chit subscription' };
  }
}

/**
 * 3. Update Chit Subscription
 */
export async function updateChit(
  id: string,
  formData: ChitFormData
): Promise<{ success: boolean; data?: Chit; error?: string }> {
  const supabase = createClient();

  try {
    const payload = {
      chit_company: formData.chitCompany,
      group_number: formData.groupNumber,
      chit_value: formData.chitValue,
      monthly_installment: formData.monthlyInstallment,
      total_months: formData.totalMonths,
      start_date: formData.startDate,
      next_due_date: formData.nextDueDate,
      status: formData.status,
      remarks: formData.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('chits').update(payload).eq('id', id).select('*').single();

    if (error) {
      console.error('Supabase updateChit error:', error);
      return { success: false, error: error.message };
    }

    const totalM = Number(data.total_months || 50);
    const paidM = Number(data.paid_months || 0);

    const updatedChit: Chit = {
      id: data.id,
      chitCompany: data.chit_company,
      groupNumber: data.group_number,
      chitValue: Number(data.chit_value || 0),
      monthlyInstallment: Number(data.monthly_installment || 0),
      totalMonths: totalM,
      paidMonths: paidM,
      remainingInstallments: Math.max(0, totalM - paidM),
      totalPaid: Number(data.total_paid || 0),
      prizeTaken: false,
      prizeAmount: 0,
      startDate: data.start_date,
      nextDueDate: data.next_due_date,
      status: data.status,
      remarks: data.remarks || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    await syncChitProfitLossAccounting(id);

    return { success: true, data: updatedChit };
  } catch (err: any) {
    console.error('Unexpected error updating chit:', err);
    return { success: false, error: err?.message || 'Failed to update chit subscription' };
  }
}

/**
 * 4. Delete Chit Subscription
 */
export async function deleteChit(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Fetch associated payments before deleting chit
    const { data: payments } = await supabase.from('chit_payments').select('id').eq('chit_id', id);

    const { error } = await supabase.from('chits').delete().eq('id', id);

    if (error) {
      console.error('Supabase deleteChit error:', error);
      return { success: false, error: error.message };
    }

    // Automatically remove Investment transactions for associated chit payments
    if (payments && payments.length > 0) {
      for (const p of payments) {
        try {
          await deleteInvestmentTransactionByReference('chit_payment', p.id);
        } catch (pErr) {
          console.warn('Notice: Failed deleting chit payment investment transaction:', p.id, pErr);
        }
      }
    }

    // Automatically remove Investment transaction for Chit Prize Received & Profit/Loss if present
    try {
      await deleteInvestmentTransactionByReference('chit_prize', id);
      await deleteInvestmentTransactionByReference('chit_profit', id);
      await deleteInvestmentTransactionByReference('chit_loss', id);
    } catch (pzErr) {
      console.warn('Notice: Failed deleting chit prize/profit/loss investment transactions:', id, pzErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting chit:', err);
    return { success: false, error: err?.message || 'Failed to delete chit subscription' };
  }
}

/**
 * 5. Record Monthly Chit Payment (Installment)
 * Automatically creates an Investment Khata transaction:
 * - Transaction Type = Chit Installment
 * - Amount Out = Installment Amount
 * - Reduces Current Investment Balance
 */
export async function recordChitPayment(
  formData: ChitPaymentFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Fetch current Chit details
    const { data: chit, error: chitErr } = await supabase
      .from('chits')
      .select('*')
      .eq('id', formData.chitId)
      .single();

    if (chitErr || !chit) {
      return { success: false, error: 'Chit subscription record not found.' };
    }

    // Insert Chit Payment Record
    const paymentPayload = {
      chit_id: formData.chitId,
      payment_date: formData.paymentDate,
      amount: formData.amount,
      receipt_number: formData.receiptNumber || null,
      payment_mode: formData.paymentMode || 'Bank Transfer',
      remarks: formData.remarks || null,
    };

    const { data: payData, error: payErr } = await supabase
      .from('chit_payments')
      .insert([paymentPayload])
      .select('id')
      .single();

    if (payErr || !payData) {
      console.error('Supabase recordChitPayment error:', payErr);
      return { success: false, error: payErr?.message || 'Failed to record chit payment' };
    }

    // Calculate new values for Chit
    const newPaidMonths = Number(chit.paid_months || 0) + 1;
    const newTotalPaid = Number(chit.total_paid || 0) + formData.amount;
    const isCompleted = newPaidMonths >= Number(chit.total_months || 50);

    // Advance next_due_date by 1 month
    const currentDueDate = new Date(chit.next_due_date || formData.paymentDate);
    const nextDueDate = new Date(currentDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    const nextDueDateISO = nextDueDate.toISOString().split('T')[0];

    const updatePayload = {
      paid_months: newPaidMonths,
      total_paid: newTotalPaid,
      next_due_date: nextDueDateISO,
      status: isCompleted ? 'completed' : chit.status,
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from('chits')
      .update(updatePayload)
      .eq('id', formData.chitId);

    if (updateErr) {
      console.error('Error updating chit metrics after payment:', updateErr);
    }

    // Automatically record chit installment in Investment Khata
    try {
      await recordInvestmentTransaction(
        'Chit Installment',
        0,
        formData.amount,
        'chit_payment',
        payData.id,
        `Chit Installment: ${chit.chit_company} (${chit.group_number})`,
        formData.paymentDate
      );
    } catch (invErr) {
      console.warn('Investment Khata chit installment hook notice:', invErr);
    }

    await syncChitProfitLossAccounting(formData.chitId);

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error recording chit payment:', err);
    return { success: false, error: err?.message || 'Failed to record chit payment' };
  }
}

/**
 * Delete a specific Chit Installment Payment & sync Investment Khata
 */
export async function deleteChitPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: payData, error: fetchErr } = await supabase
      .from('chit_payments')
      .select('*, chits(*)')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payData) {
      return { success: false, error: 'Chit payment record not found.' };
    }

    const chit = payData.chits;

    const { error: delErr } = await supabase.from('chit_payments').delete().eq('id', paymentId);
    if (delErr) {
      return { success: false, error: delErr.message };
    }

    if (chit) {
      const newPaidMonths = Math.max(0, Number(chit.paid_months || 0) - 1);
      const newTotalPaid = Math.max(0, Number(chit.total_paid || 0) - Number(payData.amount || 0));

      await supabase
        .from('chits')
        .update({
          paid_months: newPaidMonths,
          total_paid: newTotalPaid,
          status: newPaidMonths >= Number(chit.total_months || 50) ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', chit.id);
    }

    // Automatically remove matching Investment transaction & recalculate balances
    try {
      await deleteInvestmentTransactionByReference('chit_payment', paymentId);
    } catch (invErr) {
      console.warn('Notice: Failed deleting investment transaction for chit payment:', paymentId, invErr);
    }

    if (chit) {
      await syncChitProfitLossAccounting(chit.id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete chit payment' };
  }
}

/**
 * Record Chit Prize Amount Received
 * Automatically creates an Investment Khata transaction:
 * - Transaction Type = Chit Prize Received
 * - Amount In = Net Amount Received
 * - Increases Current Investment Balance
 * - Stores Prize Month & Optional Auction Discount for audit purposes
 */
export async function recordChitPrizeReceived(payload: {
  chitId: string;
  prizeMonth: number;
  prizeAmount: number;
  discountAmount?: number;
  receivedDate: string;
  remarks?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: chit, error: chitErr } = await supabase
      .from('chits')
      .select('*')
      .eq('id', payload.chitId)
      .single();

    if (chitErr || !chit) {
      return { success: false, error: 'Chit subscription record not found.' };
    }

    if (payload.prizeAmount <= 0) {
      return { success: false, error: 'Net Prize Amount must be greater than ₹0' };
    }

    if (!payload.prizeMonth || payload.prizeMonth <= 0) {
      return { success: false, error: 'Prize Month is required' };
    }

    const remarksParts = [
      `Chit Prize Received: ${chit.chit_company} (${chit.group_number})`,
      `Prize Month: Month ${payload.prizeMonth}`,
      `Net Prize Amount: ₹${payload.prizeAmount}`,
    ];

    if (payload.discountAmount && payload.discountAmount > 0) {
      remarksParts.push(`Auction Discount: ₹${payload.discountAmount}`);
    }

    if (payload.remarks && payload.remarks.trim()) {
      remarksParts.push(payload.remarks.trim());
    }

    const remarksStr = remarksParts.join(' | ');

    await supabase
      .from('chits')
      .update({
        prize_taken: true,
        prize_amount: payload.prizeAmount,
        prize_date: payload.receivedDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.chitId);

    const res = await updateInvestmentTransactionByReference(
      'chit_prize',
      payload.chitId,
      payload.prizeAmount,
      0,
      remarksStr,
      payload.receivedDate
    );

    await syncChitProfitLossAccounting(payload.chitId);

    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record chit prize received' };
  }
}

/**
 * Delete Chit Prize Received transaction & sync Investment Khata
 */
export async function deleteChitPrizeReceived(chitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteInvestmentTransactionByReference('chit_prize', chitId);
    await syncChitProfitLossAccounting(chitId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete chit prize transaction' };
  }
}

/**
 * 6. Get Payment History Ledger for a specific Chit
 */
export async function getChitPayments(
  chitId?: string
): Promise<{ success: boolean; data: ChitPayment[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('chit_payments')
      .select('*, chits(id, chit_company, group_number)')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (chitId) {
      query = query.eq('chit_id', chitId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    const formatted: ChitPayment[] = (data || []).map((p: any) => {
      const c = p.chits || {};
      return {
        id: p.id,
        chitId: p.chit_id,
        chitCompany: c.chit_company || 'N/A',
        groupNumber: c.group_number || 'N/A',
        paymentDate: p.payment_date,
        amount: Number(p.amount || 0),
        receiptNumber: p.receipt_number || undefined,
        paymentMode: p.payment_mode || 'Bank Transfer',
        remarks: p.remarks || undefined,
        createdAt: p.created_at,
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error in getChitPayments:', err);
    return { success: true, data: [] };
  }
}

/**
 * 7. Get Chit Metrics
 */
export async function getChitMetrics(): Promise<{
  success: boolean;
  data: ChitMetrics;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];
    const { monthStart, monthEnd } = getMonthDateRange(todayISO);

    // Fetch all chits
    const { data: chitsData } = await supabase.from('chits').select('*');
    const allChits = chitsData || [];

    // Fetch all payments
    const { data: paymentsData } = await supabase.from('chit_payments').select('*');
    const allPayments = paymentsData || [];

    // Fetch all profit/loss transactions
    const { data: profitLossData } = await supabase
      .from('investment_transactions')
      .select('*')
      .in('reference_type', ['chit_profit', 'chit_loss']);

    let totalChitProfit = 0;
    let totalChitLoss = 0;
    (profitLossData || []).forEach((row: any) => {
      if (row.reference_type === 'chit_profit') {
        totalChitProfit += Number(row.amount_in || 0);
      } else if (row.reference_type === 'chit_loss') {
        totalChitLoss += Number(row.amount_out || 0);
      }
    });

    totalChitProfit = Math.round(totalChitProfit * 100) / 100;
    totalChitLoss = Math.round(totalChitLoss * 100) / 100;
    const netChitProfitLoss = Math.round((totalChitProfit - totalChitLoss) * 100) / 100;

    // Fetch all prize received transactions
    const { data: prizesData } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('reference_type', 'chit_prize');

    const totalPrizeReceived = (prizesData || []).reduce((sum: number, r: any) => sum + Number(r.amount_in || 0), 0);

    const todaysChitPayments = allPayments
      .filter((p: any) => p.payment_date === todayISO)
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const thisMonthsChitPayments = allPayments
      .filter((p: any) => p.payment_date >= monthStart && p.payment_date <= monthEnd)
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const totalChitValue = allChits.reduce((sum: number, c: any) => sum + Number(c.chit_value || 0), 0);
    const totalPaidAmount = allChits.reduce((sum: number, c: any) => sum + Number(c.total_paid || 0), 0);
    const activeChitsCount = allChits.filter((c: any) => c.status === 'active').length;

    return {
      success: true,
      data: {
        todaysChitPayments,
        thisMonthsChitPayments,
        totalChitValue,
        totalPaidAmount,
        activeChitsCount,
        totalPrizeReceived,
        totalChitProfit,
        totalChitLoss,
        netChitProfitLoss,
      },
    };
  } catch (err: any) {
    console.error('Error fetching chit metrics:', err);
    return {
      success: true,
      data: {
        todaysChitPayments: 0,
        thisMonthsChitPayments: 0,
        totalChitValue: 0,
        totalPaidAmount: 0,
        activeChitsCount: 0,
        totalPrizeReceived: 0,
        totalChitProfit: 0,
        totalChitLoss: 0,
        netChitProfitLoss: 0,
      },
    };
  }
}
