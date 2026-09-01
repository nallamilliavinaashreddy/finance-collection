'use server';

import { createClient } from '@/lib/supabase/server';
import { LoanSettlement, LoanType } from '@/types';
import { recordInvestmentTransaction } from './investment';
import { recordInterestTransaction } from './interest';

export interface ProcessSettlementPayload {
  loanId: string;
  settlementType: 'full' | 'custom';
  settlementDate: string;
  amountPaid: number;
  paymentMethod?: string;
  referenceNumber?: string;
  remarks?: string;
  settledBy?: string;
}

export async function processLoanSettlement(
  payload: ProcessSettlementPayload
): Promise<{ success: boolean; data?: LoanSettlement; error?: string }> {
  try {
    const supabase = await createClient();

    // Step 1: Fetch Target Loan
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .eq('id', payload.loanId)
      .single();

    if (loanErr || !loan) {
      return { success: false, error: 'Target loan not found in database.' };
    }

    if (loan.is_closed) {
      return {
        success: false,
        error: 'This loan is already Closed or Settled. Duplicate settlements are strictly prohibited.',
      };
    }

    // Step 2: Calculate Outstanding Amounts
    const totalTarget = Number(loan.total_collection || loan.total_collection_amount || 0);
    const currentCollected = Number(loan.collected_amount || 0);
    const outstandingBeforeSettlement = Math.max(0, totalTarget - currentCollected);

    let finalAmountPaid = Math.round(Number(payload.amountPaid || 0) * 100) / 100;
    let waivedAmount = 0;

    if (payload.settlementType === 'full') {
      finalAmountPaid = outstandingBeforeSettlement;
      waivedAmount = 0;
    } else {
      waivedAmount = Math.max(0, Math.round((outstandingBeforeSettlement - finalAmountPaid) * 100) / 100);
    }

    const newTotalCollected = currentCollected + finalAmountPaid;
    const cust = loan.customers || {};

    // Step 3: Update Loan Status to Closed/Settled & Balance to 0
    const { error: loanUpdateErr } = await supabase
      .from('loans')
      .update({
        collected_amount: newTotalCollected,
        balance_amount: 0,
        is_closed: true,
      })
      .eq('id', payload.loanId);

    if (loanUpdateErr) {
      console.error('Failed to update loan state during settlement:', loanUpdateErr);
      return { success: false, error: loanUpdateErr.message || 'Failed to update loan balance.' };
    }

    // Step 4: Record Settlement Payment Transaction in Collections Table
    const settlementRemark = `[LOAN SETTLEMENT - ${payload.settlementType.toUpperCase()}] Paid: ₹${finalAmountPaid}, Waived: ₹${waivedAmount}. ${payload.remarks || ''}`.trim();

    let collectionRecordId = '';
    try {
      const { data: collData } = await supabase
        .from('collections')
        .insert([
          {
            loan_id: payload.loanId,
            amount_paid: finalAmountPaid,
            payment_date: payload.settlementDate,
            remarks: settlementRemark,
            remaining_balance_after_payment: 0,
          },
        ])
        .select()
        .single();

      if (collData) collectionRecordId = collData.id;
    } catch (collErr) {
      console.warn('Notice: collections fallback insert on settlement:', collErr);
    }

    // Step 5: Save Audit Record in loan_settlements Table
    const settlementRecord: LoanSettlement = {
      id: '',
      loanId: payload.loanId,
      customerId: loan.customer_id,
      settlementType: payload.settlementType,
      settlementDate: payload.settlementDate,
      outstandingBeforeSettlement,
      amountPaid: finalAmountPaid,
      waivedAmount,
      paymentMethod: payload.paymentMethod || 'Cash',
      referenceNumber: payload.referenceNumber?.trim() || undefined,
      remarks: payload.remarks?.trim() || undefined,
      settledBy: payload.settledBy || 'Administrator',
      createdAt: new Date().toISOString(),
    };

    try {
      const { data: settData, error: settErr } = await supabase
        .from('loan_settlements')
        .insert([
          {
            loan_id: payload.loanId,
            customer_id: loan.customer_id,
            settlement_type: payload.settlementType,
            settlement_date: payload.settlementDate,
            outstanding_before_settlement: outstandingBeforeSettlement,
            amount_paid: finalAmountPaid,
            waived_amount: waivedAmount,
            payment_method: payload.paymentMethod || 'Cash',
            reference_number: payload.referenceNumber?.trim() || null,
            remarks: payload.remarks?.trim() || null,
            settled_by: payload.settledBy || 'Administrator',
          },
        ])
        .select()
        .single();

      if (!settErr && settData) {
        settlementRecord.id = settData.id;
      }
    } catch (dbErr) {
      console.warn('Notice: loan_settlements table query skipped (table not created yet):', dbErr);
    }

    // Step 6: Record Actual Money Paid into Central Cash Flow (Investment Khata)
    // NOTE: Waived amount is NOT added to Cash In because no physical cash was received.
    if (finalAmountPaid > 0) {
      try {
        await recordInvestmentTransaction(
          'Collection Received',
          finalAmountPaid,
          0,
          'collection',
          collectionRecordId || payload.loanId,
          `Settlement Received (${payload.settlementType.toUpperCase()}) from ${cust.customer_name || 'Customer'} (${cust.customer_id || 'ID'})`,
          payload.settlementDate
        );
      } catch (invErr) {
        console.warn('Notice: Investment Khata settlement cash flow hook:', invErr);
      }

      // Step 7: Record Interest Allocated in Interest Module
      try {
        const amountGiven = Number(loan.amount_given || 0);
        const totalInterest = Math.max(0, totalTarget - amountGiven);
        const interestRatio = totalTarget > 0 ? totalInterest / totalTarget : 0;
        const interestAmount = Math.round(finalAmountPaid * interestRatio * 100) / 100;

        if (interestAmount > 0) {
          await recordInterestTransaction({
            collectionId: collectionRecordId || payload.loanId,
            loanId: payload.loanId,
            customerId: loan.customer_id,
            transactionDate: payload.settlementDate,
            interestType: (loan.loan_type || 'daily') as any,
            interestAmount,
            remarks: `Settlement Interest (${payload.settlementType.toUpperCase()}): ${cust.customer_name || 'Customer'}`,
          });
        }
      } catch (intErr) {
        console.warn('Notice: Interest module settlement hook:', intErr);
      }
    }

    return {
      success: true,
      data: settlementRecord,
    };
  } catch (err: any) {
    console.error('Error processing loan settlement:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during settlement.',
    };
  }
}

export async function getLoanSettlementHistory(
  loanId: string
): Promise<{ success: boolean; data?: LoanSettlement[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('loan_settlements')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return { success: true, data: [] };
      }
      return { success: false, error: error.message };
    }

    const formatted: LoanSettlement[] = (data || []).map((item: any) => ({
      id: item.id,
      loanId: item.loan_id,
      customerId: item.customer_id,
      settlementType: item.settlement_type as 'full' | 'custom',
      settlementDate: item.settlement_date,
      outstandingBeforeSettlement: Number(item.outstanding_before_settlement || 0),
      amountPaid: Number(item.amount_paid || 0),
      waivedAmount: Number(item.waived_amount || 0),
      paymentMethod: item.payment_method || 'Cash',
      referenceNumber: item.reference_number || undefined,
      remarks: item.remarks || undefined,
      settledBy: item.settled_by || 'Administrator',
      createdAt: item.created_at,
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Error fetching loan settlement history:', err);
    return { success: false, error: err.message };
  }
}
