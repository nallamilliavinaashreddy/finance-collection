'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { withdrawalReturnSchema, WithdrawalReturnFormData } from '@/lib/validations/investment';
import { recordWithdrawalReturn } from '@/lib/actions/investment';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { ArrowDownLeft, Calendar, IndianRupee, CreditCard, FileText } from 'lucide-react';

interface WithdrawalReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawalReturnModal({ isOpen, onClose, onSuccess }: WithdrawalReturnModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const todayISO = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalReturnFormData>({
    resolver: zodResolver(withdrawalReturnSchema),
    defaultValues: {
      amount: undefined,
      returnDate: todayISO,
      paymentMode: 'Bank Transfer',
      remarks: '',
    },
  });

  const onSubmit = async (formData: WithdrawalReturnFormData) => {
    setIsSubmitting(true);
    try {
      const res = await recordWithdrawalReturn(formData);
      if (res.success) {
        showToast('Withdrawal return recorded successfully! Capital balance updated.', 'success');
        reset();
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record withdrawal return', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while recording withdrawal return', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Withdrawal Return"
      description="Return owner's personal draw back into business capital. Increases Current Investment balance."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Return Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Return Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 10000"
              className="pl-9"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Return Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input type="date" className="pl-9 text-xs" {...register('returnDate')} />
          </div>
          {errors.returnDate && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.returnDate.message}</p>
          )}
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Mode <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 z-10" />
            <select
              {...register('paymentMode')}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Bank Transfer font-medium">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          {errors.paymentMode && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.paymentMode.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input placeholder="e.g. Return of personal draw, Capital refund" className="pl-9 text-xs" {...register('remarks')} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            leftIcon={<ArrowDownLeft className="w-4 h-4" />}
          >
            Record Return
          </Button>
        </div>
      </form>
    </Modal>
  );
}
