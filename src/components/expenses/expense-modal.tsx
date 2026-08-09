'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { expenseSchema, ExpenseFormData } from '@/lib/validations/expense';
import { Expense } from '@/types';
import { createExpense, updateExpense } from '@/lib/actions/expenses';
import { useToast } from '@/components/providers/toast-provider';
import { Calendar, DollarSign, Tag, User, CreditCard, FileText } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
}

const CATEGORIES = [
  'Office',
  'Travel',
  'Salary',
  'Utilities',
  'Maintenance',
  'Marketing',
  'Misc',
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
}: ExpenseModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(expenseToEdit);

  const defaultDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: defaultDate,
      category: 'Office',
      amount: 1000,
      description: '',
      paidTo: '',
      paymentMode: 'Cash',
      remarks: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        reset({
          expenseDate: expenseToEdit.expenseDate,
          category: expenseToEdit.category,
          amount: expenseToEdit.amount,
          description: expenseToEdit.description,
          paidTo: expenseToEdit.paidTo || '',
          paymentMode: expenseToEdit.paymentMode,
          remarks: expenseToEdit.remarks || '',
        });
      } else {
        reset({
          expenseDate: defaultDate,
          category: 'Office',
          amount: 1000,
          description: '',
          paidTo: '',
          paymentMode: 'Cash',
          remarks: '',
        });
      }
    }
  }, [isOpen, expenseToEdit, reset, defaultDate]);

  const onSubmit = async (formData: ExpenseFormData) => {
    try {
      if (isEditing && expenseToEdit) {
        const res = await updateExpense(expenseToEdit.id, formData);
        if (res.success) {
          showToast('Expense updated successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update expense', 'error');
        }
      } else {
        const res = await createExpense(formData);
        if (res.success) {
          showToast('New expense recorded successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to create expense', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while saving expense', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Record' : 'Record New Expense'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Expense Date */}
          <div className="space-y-1.5">
            <label htmlFor="expenseDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Expense Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="expenseDate"
                type="date"
                className="pl-9 h-10"
                {...register('expenseDate')}
              />
            </div>
            {errors.expenseDate && <p className="text-[11px] text-rose-500">{errors.expenseDate.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                id="category"
                {...register('category')}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && <p className="text-[11px] text-rose-500">{errors.category.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount Input with min={1} step={1} */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 2500"
                className="pl-9 h-10 font-bold"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount.message}</p>}
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
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="description"
              placeholder="e.g. Monthly office internet bill, Fuel expenses"
              className="pl-9 h-10"
              {...register('description')}
            />
          </div>
          {errors.description && <p className="text-[11px] text-rose-500">{errors.description.message}</p>}
        </div>

        {/* Paid To */}
        <div className="space-y-1.5">
          <label htmlFor="paidTo" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Paid To (Vendor / Employee / Provider)
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="paidTo"
              placeholder="e.g. Airtel Business, Ramesh (Driver)"
              className="pl-9 h-10"
              {...register('paidTo')}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remarks (Optional)
          </label>
          <Input
            id="remarks"
            placeholder="e.g. Bill #49204 attached"
            className="h-10"
            {...register('remarks')}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} variant="primary">
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

