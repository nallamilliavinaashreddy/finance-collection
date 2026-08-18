'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addCapitalSchema, AddCapitalFormData } from '@/lib/validations/investment';
import { addCapital } from '@/lib/actions/investment';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { PiggyBank, Calendar, IndianRupee, Tag, FileText, Percent } from 'lucide-react';

interface AddCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCapitalModal({ isOpen, onClose, onSuccess }: AddCapitalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const getTodayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddCapitalFormData>({
    resolver: zodResolver(addCapitalSchema),
    defaultValues: {
      amount: undefined,
      transactionDate: getTodayISO(),
      source: 'Owner Capital',
      annualInterestRate: 18,
      interestType: 'simple',
      remarks: '',
    },
  });

  const handleClose = () => {
    reset({
      amount: undefined,
      transactionDate: getTodayISO(),
      source: 'Owner Capital',
      annualInterestRate: 18,
      interestType: 'simple',
      remarks: '',
    });
    onClose();
  };

  const onSubmit = async (formData: AddCapitalFormData) => {
    setIsSubmitting(true);
    try {
      const res = await addCapital(formData);
      if (res.success) {
        showToast('Capital added to Investment Khata successfully!', 'success');
        reset();
        handleClose();
      } else {
        showToast(res.error || 'Failed to add capital', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while adding capital', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Capital / Investment"
      description="Inject new capital into your business investment ledger balance."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Capital Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 100000"
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
            Transaction Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input type="date" className="pl-9 text-xs" {...register('transactionDate')} />
          </div>
          {errors.transactionDate && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.transactionDate.message}</p>
          )}
        </div>

        {/* Interest Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Interest Type <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            {...register('interestType')}
          >
            <option value="simple">Simple Interest (Default)</option>
            <option value="compound">Compound Interest (Annual Compounding)</option>
          </select>
        </div>

        {/* Annual Interest Percentage */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Annual Interest Rate (% per year)
          </label>
          <div className="relative">
            <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="number"
              step="any"
              placeholder="e.g. 18"
              className="pl-9 text-xs"
              {...register('annualInterestRate', { valueAsNumber: true })}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Interest is calculated per year (pro-rata for partial years) from the actual capital date.
          </p>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Source of Funds <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="e.g. Personal Savings, Partner Funds, Bank Credit"
              className="pl-9 text-xs"
              {...register('source')}
            />
          </div>
          {errors.source && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.source.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input placeholder="Additional notes or references..." className="pl-9 text-xs" {...register('remarks')} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<PiggyBank className="w-4 h-4" />}>
            Add Capital
          </Button>
        </div>
      </form>
    </Modal>
  );
}
