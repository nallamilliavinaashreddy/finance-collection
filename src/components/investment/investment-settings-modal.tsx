'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { investmentSettingsSchema, InvestmentSettingsFormData } from '@/lib/validations/investment';
import { updateInvestmentSettings } from '@/lib/actions/investment';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { Percent, Settings, CheckCircle2 } from 'lucide-react';

interface InvestmentSettingsModalProps {
  isOpen: boolean;
  currentRate: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvestmentSettingsModal({
  isOpen,
  currentRate,
  onClose,
  onSuccess,
}: InvestmentSettingsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestmentSettingsFormData>({
    resolver: zodResolver(investmentSettingsSchema),
    values: {
      monthlyInterestRate: currentRate || 5.0,
    },
  });

  const onSubmit = async (formData: InvestmentSettingsFormData) => {
    setIsSubmitting(true);
    try {
      const res = await updateInvestmentSettings(formData);
      if (res.success) {
        showToast(`Monthly interest rate updated to ${formData.monthlyInterestRate}% successfully!`, 'success');
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to update interest rate', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while updating settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Monthly Interest Rate"
      description="Set the monthly interest percentage used to calculate daily simple interest on Current Investment Balance."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Monthly Interest Rate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Monthly Interest Rate (%) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="number"
              step="any"
              placeholder="e.g. 5 or 6"
              className="pl-9"
              {...register('monthlyInterestRate', { valueAsNumber: true })}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Settings className="w-3 h-3 text-[#FF7A00]" /> Daily Interest Formula:
            </div>
            <p className="font-mono text-[#FF7A00] dark:text-[#FF7A00] font-bold">
              Daily Interest = (Current Balance × Monthly Rate %) ÷ 30
            </p>
          </div>
          {errors.monthlyInterestRate && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.monthlyInterestRate.message}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Save Interest Rate
          </Button>
        </div>
      </form>
    </Modal>
  );
}

