'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { chitPaymentSchema, ChitPaymentFormData } from '@/lib/validations/chit';
import { Chit } from '@/types';
import { recordChitPayment } from '@/lib/actions/chits';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, DollarSign, CreditCard, Hash, FileText, Coins } from 'lucide-react';

interface ChitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chit: Chit | null;
}

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'];

export function ChitPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  chit,
}: ChitPaymentModalProps) {
  const { showToast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChitPaymentFormData>({
    resolver: zodResolver(chitPaymentSchema),
    defaultValues: {
      chitId: chit?.id || '',
      paymentDate: defaultDate,
      amount: chit?.monthlyInstallment || 10000,
      receiptNumber: '',
      paymentMode: 'Bank Transfer',
      remarks: '',
    },
  });

  useEffect(() => {
    if (isOpen && chit) {
      reset({
        chitId: chit.id,
        paymentDate: defaultDate,
        amount: chit.monthlyInstallment,
        receiptNumber: '',
        paymentMode: 'Bank Transfer',
        remarks: `Month #${chit.paidMonths + 1} installment payment`,
      });
    }
  }, [isOpen, chit, reset, defaultDate]);

  if (!chit) return null;

  const onSubmit = async (formData: ChitPaymentFormData) => {
    try {
      const res = await recordChitPayment(formData);
      if (res.success) {
        showToast(`Monthly payment recorded for ${chit.chitCompany}! Next due date advanced by 1 month.`, 'success');
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record monthly chit payment', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while saving payment', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Monthly Chit Payment"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Chit Subscription Brief Card */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col gap-1 text-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-600" />
              {chit.chitCompany}
            </span>
            <Badge variant="outline" className="font-mono text-xs border-amber-300 text-amber-700 dark:text-amber-300">
              {chit.groupNumber}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
            <div>
              <span className="text-slate-500">Chit Pool Value:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(chit.chitValue)}</p>
            </div>
            <div>
              <span className="text-slate-500">Monthly Installment:</span>
              <p className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(chit.monthlyInstallment)}</p>
            </div>
            <div>
              <span className="text-slate-500">Installments Paid:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {chit.paidMonths} / {chit.totalMonths} months
              </p>
            </div>
            <div>
              <span className="text-slate-500">Total Paid So Far:</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(chit.totalPaid)}</p>
            </div>
          </div>
        </div>

        {/* Hidden chitId */}
        <input type="hidden" {...register('chitId')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Date */}
          <div className="space-y-1.5">
            <label htmlFor="paymentDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="paymentDate"
                type="date"
                className="pl-9 h-10"
                {...register('paymentDate')}
              />
            </div>
            {errors.paymentDate && <p className="text-[11px] text-rose-500">{errors.paymentDate.message}</p>}
          </div>

          {/* Payment Amount (₹) with flexible custom amount support */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                Suggested: {formatCurrency(chit.monthlyInstallment)}
              </span>
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                placeholder="Enter any custom amount (e.g. 5000, 10000, 15000)"
                className="pl-9 h-10 font-bold text-emerald-600 dark:text-emerald-400"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            <p className="text-[10px] text-slate-500">Flexible payment: Enter any custom installment amount.</p>
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label htmlFor="paymentMode" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                id="paymentMode"
                {...register('paymentMode')}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            {errors.paymentMode && <p className="text-[11px] text-rose-500">{errors.paymentMode.message}</p>}
          </div>

          {/* Receipt / UTR Number */}
          <div className="space-y-1.5">
            <label htmlFor="receiptNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Receipt / UTR Number (Optional)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="receiptNumber"
                placeholder="e.g. UTR4920410, RCT-940"
                className="pl-9 h-10 font-mono"
                {...register('receiptNumber')}
              />
            </div>
          </div>
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
              placeholder="e.g. Month #13 payment via SBI Netbanking"
              className="pl-9 h-10"
              {...register('remarks')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} variant="primary">
            Submit Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

