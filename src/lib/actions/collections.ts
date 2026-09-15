import { createClient } from '@/lib/supabase/client';
import { Collection, LoanType, InterestType } from '@/types';
import { CollectionFormData } from '@/lib/validations/collection';
import { getWeekDateRange, getMonthDateRange } from '@/lib/utils';
import { decodeLoanType } from '@/lib/actions/loans';
import { recordInvestmentTransaction, deleteInvestmentTransactionByReference } from '@/lib/actions/investment';
import { recordInterestTransaction, deleteInterestTransactionByCollectionId } from '@/lib/actions/interest';
import { recordAdjustmentPayment, getAdjustmentLoanBalances } from '@/lib/actions/adjustment-ledger';

// 1. Get Collections from Supabase (Joined with loans & customers)
export async function getCollections(
  searchQuery: string = '',
  dateFilter: string = ''
): Promise<{ success: boolean; data: Collection[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('collections')
      .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number))')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (dateFilter && dateFilter.trim().length > 0) {
      query = query.eq('payment_date', dateFilter.trim());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getCollections error:', error);
      return { success: false, data: [], error: error.message };
    }

    // Build historical balance snapshots for loans
    const loanPaymentsMap = new Map<string, { totalTarget: number; records: any[] }>();

    (data || []).forEach((item: any) => {
      const loanId = item.loan_id;
      if (!loanPaymentsMap.has(loanId)) {
        const totalTarget = Number(item.loans?.total_collection || 0);
        loanPaymentsMap.set(loanId, { totalTarget, records: [] });
      }
      loanPaymentsMap.get(loanId)!.records.push(item);
    });

    const computedSnapshotMap = new Map<string, number>();
    loanPaymentsMap.forEach(({ totalTarget, records }) => {
      const chrono = [...records].sort((a, b) => {
        const d1 = new Date(a.payment_date).getTime();
        const d2 = new Date(b.payment_date).getTime();
        if (d1 !== d2) return d1 - d2;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      let currentBal = totalTarget;
      chrono.forEach((rec) => {
        const paid = Number(rec.amount_paid || 0);
        if (rec.remaining_balance_after_payment !== undefined && rec.remaining_balance_after_payment !== null) {
          currentBal = Number(rec.remaining_balance_after_payment);
        } else {
          currentBal = Math.max(0, currentBal - paid);
        }
        computedSnapshotMap.set(rec.id, currentBal);
      });
    });

    let formatted: Collection[] = (data || []).map((item: any) => {
      const loan = item.loans || {};
      const cust = loan.customers || {};
      const storedBal = item.remaining_balance_after_payment;
      const lType: LoanType = decodeLoanType(loan.working_days, loan.loan_type);

      const remainingBalAfter = storedBal !== undefined && storedBal !== null
        ? Number(storedBal)
        : (computedSnapshotMap.get(item.id) ?? Number(loan.balance_amount || 0));

      return {
        id: item.id,
        loanId: item.loan_id,
        customerId: loan.customer_id || '',
        customerCode: cust.customer_id || 'N/A',
        customerName: cust.customer_name || 'Customer',
        loanType: lType,
        amountPaid: Number(item.amount_paid || 0),
        paymentDate: item.payment_date,
        remarks: item.remarks || undefined,
        remainingBalanceAfterPayment: remainingBalAfter,
        weekNumber: item.week_number || undefined,
        weekStartDate: item.week_start_date || undefined,
        createdAt: item.created_at,
      };
    });

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      formatted = formatted.filter(
        (c) =>
          c.customerCode.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.paymentDate.includes(q)
      );
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error fetching collections from Supabase:', err);
    return { success: false, data: [], error: err?.message || 'Failed to fetch collections' };
  }
}
// 2. Create Collection in Supabase
// Enforces Type-Specific Business Rules (Daily, Weekly, Monthly, Adjustment)
export async function createCollection(formData: CollectionFormData): Promise<{ success: boolean; data?: Collection; error?: string }> {
  const supabase = createClient();

  try {
    // Step 1: Query selected loan
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('*, customers(id, customer_id, customer_name, mobile_number)')
      .eq('id', formData.loanId)
      .single();

    if (loanErr || !loan) {
      return { success: false, error: 'Selected loan not found in database.' };
    }

    if (loan.is_closed) {
      return {
        success: false,
        error: 'Selected loan is already Closed. Collections can only be recorded for Active loans.',
      };
    }

    const loanType: LoanType = decodeLoanType(loan.working_days, loan.loan_type);

    if (loanType === 'adjustment') {
      const adjRes = await recordAdjustmentPayment(
        formData.loanId,
        formData.paymentDate,
        formData.amountPaid,
        formData.remarks
      );
      if (!adjRes.success) {
        return { success: false, error: adjRes.error || 'Failed to record adjustment collection' };
      }
      const custInfo = loan.customers || {};
      return {
        success: true,
        data: {
          id: adjRes.data?.id || `adj-${Date.now()}`,
          loanId: formData.loanId,
          customerId: loan.customer_id || '',
          customerCode: custInfo.customer_id || 'N/A',
          customerName: custInfo.customer_name || 'Customer',
          loanType: 'adjustment',
          amountPaid: formData.amountPaid,
          paymentDate: formData.paymentDate,
          remarks: formData.remarks || undefined,
          remainingBalanceAfterPayment: adjRes.data?.closingBalance || 0,
          createdAt: new Date().toISOString(),
        },
      };
    }

    // Step 2: Calculate post-payment remaining balance based on exact sum of valid collections
    const { data: existingColls } = await supabase
      .from('collections')
      .select('amount_paid')
      .eq('loan_id', formData.loanId);

    const currentCollected = (existingColls || []).reduce((sum: number, c: any) => sum + Number(c.amount_paid || 0), 0);
    const totalTarget = Number(loan.total_collection || 0);

    const newCollected = currentCollected + formData.amountPaid;
    const newBalanceAfterPayment = Math.max(0, totalTarget - newCollected);
    const isClosedNow = newBalanceAfterPayment <= 0;

    // Step 4: Update loans table
    const { error: loanUpdateErr } = await supabase
      .from('loans')
      .update({
        collected_amount: newCollected,
        balance_amount: newBalanceAfterPayment,
        is_closed: isClosedNow,
      })
      .eq('id', formData.loanId);

    if (loanUpdateErr) {
      console.error('Supabase update loan balance error:', loanUpdateErr);
    }

    // Step 5: Save clean collection payload matching exact Supabase schema
    const cleanPayload = {
      loan_id: formData.loanId,
      amount_paid: formData.amountPaid,
      payment_date: formData.paymentDate,
      remarks: formData.remarks?.trim() || null,
    };

    const res = await supabase
      .from('collections')
      .insert([cleanPayload])
      .select('*, loans(*, customers(id, customer_id, customer_name, mobile_number)))')
      .single();

    const newCollData = res.data;
    const insertErr = res.error;

    if (insertErr || !newCollData) {
      console.error('Supabase insert collection error:', insertErr);
      return { success: false, error: insertErr?.message || 'Failed to insert collection' };
    }

    const loanInfo = newCollData.loans || {};
    const custInfo = loanInfo.customers || {};

    const formatted: Collection = {
      id: newCollData.id,
      loanId: newCollData.loan_id,
      customerId: loanInfo.customer_id || '',
      customerCode: custInfo.customer_id || 'N/A',
      customerName: custInfo.customer_name || 'Customer',
      amountPaid: Number(newCollData.amount_paid || 0),
      paymentDate: newCollData.payment_date,
      remarks: newCollData.remarks || undefined,
      remainingBalanceAfterPayment: newBalanceAfterPayment,
      createdAt: newCollData.created_at,
    };

    // Automatically record collection in Investment Khata
    try {
      await recordInvestmentTransaction(
        'Collection Received',
        formData.amountPaid,
        0,
        'collection',
        newCollData.id,
        `Collection Received from ${custInfo.customer_name || 'Customer'} (${custInfo.customer_id || 'ID'})`,
        formData.paymentDate
      );
    } catch (invErr) {
      console.warn('Investment Khata collection hook notice:', invErr);
    }

    // Automatically record interest collected in Interest Module
    try {
      const amountGiven = Number(loan.amount_given || 0);
      const totalTarget = Number(loan.total_collection || 0);
      const totalInterest = Math.max(0, totalTarget - amountGiven);
      const interestRatio = totalTarget > 0 ? totalInterest / totalTarget : 0;
      const interestAmount = Math.round(formData.amountPaid * interestRatio * 100) / 100;

      if (interestAmount > 0) {
        await recordInterestTransaction({
          collectionId: newCollData.id,
          loanId: formData.loanId,
          customerId: loan.customer_id,
          transactionDate: formData.paymentDate,
          interestType: (loanType || 'daily') as InterestType,
          interestAmount: interestAmount,
          remarks: `Collection Interest (${loanType}): ${custInfo.customer_name || 'Customer'} (${custInfo.customer_id || 'ID'})`,
        });
      }
    } catch (intErr) {
      console.warn('Interest collection hook notice:', intErr);
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Unexpected error recording collection in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to record collection' };
  }
}

// 3. Delete Collection from Supabase
export async function deleteCollection(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: coll, error: fetchErr } = await supabase
      .from('collections')
      .select('*, loans(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !coll) {
      return { success: false, error: 'Collection record not found.' };
    }

    const loanInfo = coll.loans || {};
    const loanType: LoanType = decodeLoanType(loanInfo.working_days, loanInfo.loan_type);

    // Delete row from collections table
    const { error: delErr } = await supabase.from('collections').delete().eq('id', id);
    if (delErr) {
      console.error('Supabase delete collection error:', delErr);
      return { success: false, error: delErr.message };
    }

    // Reverse adjustment_ledger payment if it is an adjustment loan
    if (loanType === 'adjustment' && coll.loan_id) {
      try {
        const { data: matchingLedger } = await supabase
          .from('adjustment_ledger')
          .select('id')
          .eq('loan_id', coll.loan_id)
          .eq('transaction_type', 'payment')
          .eq('payment_received', coll.amount_paid)
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchingLedger && matchingLedger.length > 0) {
          const adjLedgerId = matchingLedger[0].id;
          await supabase.from('adjustment_ledger').delete().eq('id', adjLedgerId);
          // Delete investment transaction if referenced by adjustment_ledger id
          await deleteInvestmentTransactionByReference('collection', adjLedgerId);
        }
      } catch (adjDelErr) {
        console.warn('Notice: Error clearing adjustment_ledger payment on collection delete:', adjDelErr);
      }

      // Re-evaluate adjustment loan balances
      try {
        const adjBalances = await getAdjustmentLoanBalances(coll.loan_id, supabase);
        const isClosedNow = adjBalances.principalOutstanding <= 0 && adjBalances.accruedInterest <= 0;

        await supabase
          .from('loans')
          .update({
            collected_amount: adjBalances.totalPrincipalPaid,
            balance_amount: adjBalances.principalOutstanding,
            is_closed: isClosedNow,
          })
          .eq('id', coll.loan_id);
      } catch (adjBalErr) {
        console.warn('Notice: Error updating adjustment loan balance on delete:', adjBalErr);
      }
    } else if (coll.loans) {
      // Re-evaluate standard loan balances (Daily, Weekly, Monthly)
      const { data: remainingColls } = await supabase
        .from('collections')
        .select('amount_paid')
        .eq('loan_id', coll.loan_id);

      const newCollected = (remainingColls || []).reduce((sum: number, c: any) => sum + Number(c.amount_paid || 0), 0);
      const totalTarget = Number(coll.loans.total_collection || 0);
      const newBalance = Math.max(0, totalTarget - newCollected);
      const isClosedNow = newBalance <= 0;

      await supabase
        .from('loans')
        .update({
          collected_amount: newCollected,
          balance_amount: newBalance,
          is_closed: isClosedNow,
        })
        .eq('id', coll.loan_id);
    }

    // Automatically delete interest entry linked to this collection
    try {
      await deleteInterestTransactionByCollectionId(id);
    } catch (intDelErr) {
      console.warn('Notice: Failed deleting interest transaction for collection:', id, intDelErr);
    }

    // Automatically delete investment transaction linked to this collection
    try {
      await deleteInvestmentTransactionByReference('collection', id);
    } catch (invDelErr) {
      console.warn('Notice: Failed deleting investment transaction for collection:', id, invDelErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting collection from Supabase:', err);
    return { success: false, error: err?.message || 'Failed to delete collection' };
  }
}
