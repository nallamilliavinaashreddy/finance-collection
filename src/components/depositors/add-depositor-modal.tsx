'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { depositorSchema, DepositorFormData } from '@/lib/validations/depositor';
import { Depositor } from '@/types';
import { createDepositor, updateDepositor } from '@/lib/actions/depositors';
import { useToast } from '@/components/providers/toast-provider';
import { User, Phone, MapPin, DollarSign, Percent, Calendar, CreditCard, FileText, Landmark } from 'lucide-react';

interface AddDepositorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  depositorToEdit?: Depositor | null;
}

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque'];

export function AddDepositorModal({
  isOpen,
  onClose,
  onSuccess,
  depositorToEdit,
}: AddDepositorModalProps) {
  const { showToast } = useToast();

  const defaultDate = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepositorFormData>({
    resolver: zodResolver(depositorSchema),
    defaultValues: {
      depositorName: '',
      mobileNumber: '',
      address: '',
      depositAmount: 100000,
      monthlyInterestRate: 2.0,
      depositDate: defaultDate,
      expectedReturnDate: '',
      paymentMode: 'Bank Transfer',
      remarks: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (depositorToEdit) {
        reset({
          depositorName: depositorToEdit.depositorName,
          mobileNumber: depositorToEdit.mobileNumber || '',
          address: depositorToEdit.address || '',
          depositAmount: depositorToEdit.depositAmount,
          monthlyInterestRate: depositorToEdit.monthlyInterestRate,
          depositDate: depositorToEdit.depositDate,
          expectedReturnDate: depositorToEdit.expectedReturnDate || '',
          paymentMode: (depositorToEdit.paymentMode as any) || 'Bank Transfer',
          remarks: depositorToEdit.remarks || '',
        });
      } else {
        reset({
          depositorName: '',
          mobileNumber: '',
          address: '',
          depositAmount: 100000,
          monthlyInterestRate: 2.0,
          depositDate: defaultDate,
          expectedReturnDate: '',
          paymentMode: 'Bank Transfer',
          remarks: '',
        });
      }
    }
  }, [isOpen, depositorToEdit, reset, defaultDate]);

  const onSubmit = async (formData: DepositorFormData) => {
    try {
      if (depositorToEdit) {
        const res = await updateDepositor(depositorToEdit.id, formData);
        if (res.success) {
          showToast(`Depositor "${formData.depositorName}" updated successfully!`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update depositor', 'error');
        }
      } else {
        const res = await createDepositor(formData);
        if (res.success) {
          showToast(
            `Depositor "${formData.depositorName}" added! Working Capital increased automatically.`,
            'success'
          );
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to add depositor', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={depositorToEdit ? 'Edit Depositor Details' : 'Add New Depositor'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Info callout */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
          <Landmark className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Borrowed funds from depositors increase business working capital in real-time. Monthly interest paid is tracked automatically without manual entry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Depositor Name */}
          <div className="space-y-1.5">
            <label htmlFor="depositorName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Depositor Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="depositorName"
                placeholder="e.g. Venkata Rao / Subba Reddy"
                className="pl-9 h-10 font-medium"
                {...register('depositorName')}
              />
            </div>
            {errors.depositorName && <p className="text-[11px] text-rose-500">{errors.depositorName.message}</p>}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label htmlFor="mobileNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="mobileNumber"
                placeholder="e.g. 9849012345"
                className="pl-9 h-10 font-mono"
                {...register('mobileNumber')}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Address / City (Optional)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="address"
              placeholder="e.g. Danavaipeta, Rajahmundry"
              className="pl-9 h-10"
              {...register('address')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Deposit Amount */}
          <div className="space-y-1.5">
            <label htmlFor="depositAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deposit Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="depositAmount"
                type="number"
                min={1}
                step={1}
                disabled={Boolean(depositorToEdit)}
                placeholder="e.g. 200000"
                className="pl-9 h-10 font-bold text-emerald-600 dark:text-emerald-400"
                {...register('depositAmount', { valueAsNumber: true })}
              />
            </div>
            {errors.depositAmount && <p className="text-[11px] text-rose-500">{errors.depositAmount.message}</p>}
          </div>

          {/* Monthly Interest Rate (%) */}
          <div className="space-y-1.5">
            <label htmlFor="monthlyInterestRate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Interest Rate (%) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Percent className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="monthlyInterestRate"
                type="number"
                min={0}
                step={0.1}
                placeholder="e.g. 2.0"
                className="pl-9 h-10 font-bold text-amber-600 dark:text-amber-400"
                {...register('monthlyInterestRate', { valueAsNumber: true })}
              />
            </div>
            {errors.monthlyInterestRate && (
              <p className="text-[11px] text-rose-500">{errors.monthlyInterestRate.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Deposit Date */}
          <div className="space-y-1.5">
            <label htmlFor="depositDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deposit Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="depositDate"
                type="date"
                className="pl-9 h-10"
                {...register('depositDate')}
              />
            </div>
            {errors.depositDate && <p className="text-[11px] text-rose-500">{errors.depositDate.message}</p>}
          </div>

          {/* Expected Return Date (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="expectedReturnDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Expected Return Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="expectedReturnDate"
                type="date"
                className="pl-9 h-10"
                {...register('expectedReturnDate')}
              />
            </div>
          </div>

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
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              placeholder="e.g. Monthly interest paid on 5th of every month"
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
          <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<Landmark className="w-4 h-4" />}>
            {depositorToEdit ? 'Save Changes' : 'Create Depositor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
