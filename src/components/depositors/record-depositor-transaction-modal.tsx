'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Depositor } from '@/types';
import { depositorTransactionSchema, DepositorTransactionFormData } from '@/lib/validations/depositor';
import { recordDepositorTransaction, calculateDepositorInterest } from '@/lib/actions/depositors';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign, FileText, User, Receipt, Landmark } from 'lucide-react';

interface RecordDepositorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  depositor: Depositor | null;
}

export function RecordDepositorTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  depositor,
}: RecordDepositorTransactionModalProps) {
  const { showToast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DepositorTransactionFormData>({
    resolver: zodResolver(depositorTransactionSchema),
    defaultValues: {
      depositorId: depositor?.id || '',
      transactionType: 'interest_paid',
      amount: 0,
      transactionDate: defaultDate,
      remarks: '',
    },
  });

  const selectedType = watch('transactionType');
  const selectedTxDate = watch('transactionDate') || defaultDate;

  // Suggested interest calculation based on exact elapsed days
  const interestCalcInfo = useMemo(() => {
    if (!depositor) return { accruedInterest: 0, elapsedDays: 0 };
    const annualRate = depositor.annualInterestRate || (depositor.monthlyInterestRate * 12);
    const iType = depositor.interestType || 'simple';
    return calculateDepositorInterest(
      depositor.outstandingPrincipal,
      annualRate,
      iType,
      depositor.depositDate,
      selectedTxDate
    );
  }, [depositor, selectedTxDate]);

  const suggestedInterest = useMemo(() => {
    if (!depositor) return 0;
    if (interestCalcInfo.elapsedDays > 0) {
      return interestCalcInfo.accruedInterest;
    }
    return Math.round((depositor.outstandingPrincipal * depositor.monthlyInterestRate) / 100);
  }, [depositor, interestCalcInfo]);

  useEffect(() => {
    if (isOpen && depositor) {
      const daysText = interestCalcInfo.elapsedDays > 0 ? `${interestCalcInfo.elapsedDays} days` : '1 month';
      reset({
        depositorId: depositor.id,
        transactionType: 'interest_paid',
        amount: suggestedInterest,
        transactionDate: selectedTxDate,
        remarks: `Interest Payment (${daysText} @ ${depositor.monthlyInterestRate}%/mo)`,
      });
    }
  }, [isOpen, depositor, reset, selectedTxDate, suggestedInterest, interestCalcInfo.elapsedDays]);

  // Update suggested amount when transaction type changes
  const handleTypeChange = (type: string) => {
    if (!depositor) return;
    if (type === 'interest_paid') {
      const daysText = interestCalcInfo.elapsedDays > 0 ? `${interestCalcInfo.elapsedDays} days` : '1 month';
      setValue('amount', suggestedInterest);
      setValue('remarks', `Interest Payment (${daysText} @ ${depositor.monthlyInterestRate}%/mo)`);
    } else if (type === 'full_return') {
      setValue('amount', depositor.outstandingPrincipal);
      setValue('remarks', `Full Principal Returned & Settled`);
    } else if (type === 'partial_return') {
      setValue('amount', Math.round(depositor.outstandingPrincipal / 2));
      setValue('remarks', `Partial Principal Returned`);
    } else if (type === 'deposit_received') {
      setValue('amount', 50000);
      setValue('remarks', `Additional Deposit Top-up`);
    }
  };

  if (!depositor) return null;

  const onSubmit = async (formData: DepositorTransactionFormData) => {
    try {
      const res = await recordDepositorTransaction(formData);
      if (res.success) {
        showToast(
          `Transaction recorded for ${depositor.depositorName}! Depositor ledger and Investment Khata updated automatically.`,
          'success'
        );
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record depositor transaction', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while recording transaction', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Action - ${depositor.depositorName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Depositor Brief Card */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col gap-1 text-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-amber-600" />
              {depositor.depositorName}
            </span>
            <Badge variant={depositor.status === 'active' ? 'success' : 'outline'} className="text-[10px] uppercase">
              {depositor.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
            <div>
              <span className="text-slate-500">Deposit Amount:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(depositor.depositAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Monthly Interest:</span>
              <p className="font-bold text-amber-600 dark:text-amber-400">{depositor.monthlyInterestRate}% / mo</p>
            </div>
            <div>
              <span className="text-slate-500">Outstanding Principal:</span>
              <p className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">{formatCurrency(depositor.outstandingPrincipal)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Interest Paid:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(depositor.totalInterestPaid)}</p>
            </div>
          </div>
        </div>

        {/* Hidden depositorId */}
        <input type="hidden" {...register('depositorId')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <div className="space-y-1.5">
            <label htmlFor="transactionType" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Action / Transaction Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="transactionType"
              {...register('transactionType')}
              onChange={(e) => {
                register('transactionType').onChange(e);
                handleTypeChange(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="interest_paid">Monthly Interest Paid (-)</option>
              <option value="partial_return">Partial Principal Returned (-)</option>
              <option value="full_return">Full Principal Returned & Settle (-)</option>
              <option value="deposit_received">Additional Deposit Received (+)</option>
            </select>
            {errors.transactionType && <p className="text-[11px] text-rose-500">{errors.transactionType.message}</p>}
          </div>

          {/* Transaction Date */}
          <div className="space-y-1.5">
            <label htmlFor="transactionDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Transaction Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="transactionDate"
                type="date"
                className="pl-9 h-10"
                {...register('transactionDate')}
              />
            </div>
            {errors.transactionDate && <p className="text-[11px] text-rose-500">{errors.transactionDate.message}</p>}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            {selectedType === 'interest_paid' && (
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200">
                Accrued Interest ({interestCalcInfo.elapsedDays > 0 ? `${interestCalcInfo.elapsedDays} elapsed days` : `${depositor.monthlyInterestRate}%/mo`}): {formatCurrency(suggestedInterest)}
              </span>
            )}
            {selectedType === 'full_return' && (
              <span className="text-[10px] font-semibold text-[#FF7A00] dark:text-[#FF7A00] bg-[#141414] dark:bg-[#111111] px-1.5 py-0.5 rounded border border-[#262626]">
                Full Principal Due: {formatCurrency(depositor.outstandingPrincipal)}
              </span>
            )}
          </div>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="amount"
              type="number"
              min={1}
              step={1}
              placeholder="Enter transaction amount"
              className="pl-9 h-10 font-bold text-slate-900 dark:text-slate-100"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount.message}</p>}
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remarks (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="remarks"
              placeholder="e.g. Monthly interest paid via UPI / Bank Transfer"
              className="pl-9 h-10 text-xs"
              {...register('remarks')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<Receipt className="w-4 h-4" />}>
            Submit Transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
}

