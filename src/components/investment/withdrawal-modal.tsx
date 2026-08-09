'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessWithdrawalSchema, BusinessWithdrawalFormData } from '@/lib/validations/investment';
import { recordBusinessWithdrawal } from '@/lib/actions/investment';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { ArrowUpRight, Calendar, IndianRupee, FileText } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawalModal({ isOpen, onClose, onSuccess }: WithdrawalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const todayISO = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessWithdrawalFormData>({
    resolver: zodResolver(businessWithdrawalSchema),
    defaultValues: {
      amount: undefined,
      withdrawalDate: todayISO,
      remarks: '',
    },
  });

  const onSubmit = async (formData: BusinessWithdrawalFormData) => {
    setIsSubmitting(true);
    try {
      const res = await recordBusinessWithdrawal(formData);
      if (res.success) {
        showToast('Business withdrawal recorded successfully!', 'success');
        reset();
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record withdrawal', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while recording withdrawal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Business Withdrawal"
      description="Withdraw funds from investment balance. Reduces current balance immediately."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Withdrawal Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 25000"
              className="pl-9"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Withdrawal Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input type="date" className="pl-9 text-xs" {...register('withdrawalDate')} />
          </div>
          {errors.withdrawalDate && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.withdrawalDate.message}</p>
          )}
        </div>

        {/* Purpose / Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Purpose / Remarks (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input placeholder="e.g. Owner personal draw, Capital reduction" className="pl-9 text-xs" {...register('remarks')} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="danger" isLoading={isSubmitting} leftIcon={<ArrowUpRight className="w-4 h-4" />}>
            Record Withdrawal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
