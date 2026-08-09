'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chitSchema, ChitFormData } from '@/lib/validations/chit';
import { Chit } from '@/types';
import { createChit, updateChit } from '@/lib/actions/chits';
import { useToast } from '@/components/providers/toast-provider';
import { Building2, Hash, DollarSign, Calendar, Clock, SlidersHorizontal, FileText } from 'lucide-react';

interface ChitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chitToEdit?: Chit | null;
}

export function ChitModal({
  isOpen,
  onClose,
  onSuccess,
  chitToEdit,
}: ChitModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(chitToEdit);

  const defaultStartDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultNextDueDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChitFormData>({
    resolver: zodResolver(chitSchema),
    defaultValues: {
      chitCompany: '',
      groupNumber: '',
      chitValue: 500000,
      monthlyInstallment: 10000,
      totalMonths: 50,
      startDate: defaultStartDate,
      nextDueDate: defaultNextDueDate,
      status: 'active',
      remarks: '',
    },
  });

  const watchChitValue = watch('chitValue');
  const watchTotalMonths = watch('totalMonths');

  // Auto calculate monthly installment preview when chitValue or totalMonths change
  useEffect(() => {
    const val = Number(watchChitValue) || 0;
    const months = Number(watchTotalMonths) || 50;
    if (val > 0 && months > 0 && !isEditing) {
      setValue('monthlyInstallment', Math.round(val / months));
    }
  }, [watchChitValue, watchTotalMonths, isEditing, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (chitToEdit) {
        reset({
          chitCompany: chitToEdit.chitCompany,
          groupNumber: chitToEdit.groupNumber,
          chitValue: chitToEdit.chitValue,
          monthlyInstallment: chitToEdit.monthlyInstallment,
          totalMonths: chitToEdit.totalMonths,
          startDate: chitToEdit.startDate,
          nextDueDate: chitToEdit.nextDueDate,
          status: chitToEdit.status,
          remarks: chitToEdit.remarks || '',
        });
      } else {
        reset({
          chitCompany: '',
          groupNumber: '',
          chitValue: 500000,
          monthlyInstallment: 10000,
          totalMonths: 50,
          startDate: defaultStartDate,
          nextDueDate: defaultNextDueDate,
          status: 'active',
          remarks: '',
        });
      }
    }
  }, [isOpen, chitToEdit, reset, defaultStartDate, defaultNextDueDate]);

  const onSubmit = async (formData: ChitFormData) => {
    try {
      if (isEditing && chitToEdit) {
        const res = await updateChit(chitToEdit.id, formData);
        if (res.success) {
          showToast('Chit subscription updated successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update chit subscription', 'error');
        }
      } else {
        const res = await createChit(formData);
        if (res.success) {
          showToast('New chit subscription added successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to create chit subscription', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while saving chit subscription', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Chit Subscription' : 'Add New Chit Subscription'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chit Company Name */}
          <div className="space-y-1.5">
            <label htmlFor="chitCompany" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chit Company / Fund Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="chitCompany"
                placeholder="e.g. Margadarsi Chits, Kapil Chits"
                className="pl-9 h-10 font-medium"
                {...register('chitCompany')}
              />
            </div>
            {errors.chitCompany && <p className="text-[11px] text-rose-500">{errors.chitCompany.message}</p>}
          </div>

          {/* Group / Ticket Number */}
          <div className="space-y-1.5">
            <label htmlFor="groupNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Group / Ticket Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="groupNumber"
                placeholder="e.g. G-102/4, Ticket #28"
                className="pl-9 h-10 font-mono"
                {...register('groupNumber')}
              />
            </div>
            {errors.groupNumber && <p className="text-[11px] text-rose-500">{errors.groupNumber.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chit Pool Value (₹) with min={1} step={1} */}
          <div className="space-y-1.5">
            <label htmlFor="chitValue" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chit Value (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="chitValue"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500000"
                className="pl-9 h-10 font-bold"
                {...register('chitValue', { valueAsNumber: true })}
              />
            </div>
            {errors.chitValue && <p className="text-[11px] text-rose-500">{errors.chitValue.message}</p>}
          </div>

          {/* Monthly Installment (₹) with min={1} step={1} */}
          <div className="space-y-1.5">
            <label htmlFor="monthlyInstallment" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Installment (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="monthlyInstallment"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 10000"
                className="pl-9 h-10 font-bold text-amber-600 dark:text-amber-400"
                {...register('monthlyInstallment', { valueAsNumber: true })}
              />
            </div>
            {errors.monthlyInstallment && (
              <p className="text-[11px] text-rose-500">{errors.monthlyInstallment.message}</p>
            )}
          </div>

          {/* Total Months */}
          <div className="space-y-1.5">
            <label htmlFor="totalMonths" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Months Duration <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="totalMonths"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 50"
                className="pl-9 h-10 font-semibold"
                {...register('totalMonths', { valueAsNumber: true })}
              />
            </div>
            {errors.totalMonths && <p className="text-[11px] text-rose-500">{errors.totalMonths.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label htmlFor="startDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="startDate"
                type="date"
                className="pl-9 h-10"
                {...register('startDate')}
              />
            </div>
            {errors.startDate && <p className="text-[11px] text-rose-500">{errors.startDate.message}</p>}
          </div>

          {/* Next Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="nextDueDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Next Due Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="nextDueDate"
                type="date"
                className="pl-9 h-10"
                {...register('nextDueDate')}
              />
            </div>
            {errors.nextDueDate && <p className="text-[11px] text-rose-500">{errors.nextDueDate.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                id="status"
                {...register('status')}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed / Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remarks / Account Details (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="remarks"
              placeholder="e.g. Auction lifted on month #12, Bank auto-debit on 5th"
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
            {isEditing ? 'Save Changes' : 'Record Chit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

