'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { loanSchema, LoanFormData } from '@/lib/validations/loan';
import { Customer, Loan, LoanType } from '@/types';
import { getCustomers } from '@/lib/actions/customers';
import { formatCurrency } from '@/lib/utils';
import { SlidersHorizontal, Calculator, Calendar, Landmark, MapPin, Percent } from 'lucide-react';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: LoanFormData) => Promise<void>;
  loan?: Loan | null;
  isLoading?: boolean;
}

export function LoanModal({
  isOpen,
  onClose,
  onSubmit,
  loan,
  isLoading = false,
}: LoanModalProps) {
  const isEditing = Boolean(loan);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (isOpen) {
      getCustomers().then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      });
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      customerId: '',
      loanType: 'daily',
      amountGiven: 10000,
      totalCollectionAmount: 12000,
      interestRate: 6,
      workingDays: 100,
      totalWeeks: 10,
      totalMonths: 6,
      dailyAmount: 120,
      weeklyAmount: 1200,
      monthlyAmount: 2000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    },
  });

  const watchLoanType = watch('loanType') as LoanType;
  const watchAmountGiven = watch('amountGiven');
  const watchTotalCollection = watch('totalCollectionAmount');
  const watchWorkingDays = watch('workingDays');
  const watchTotalWeeks = watch('totalWeeks');
  const watchTotalMonths = watch('totalMonths');
  const watchDailyAmount = watch('dailyAmount');
  const watchWeeklyAmount = watch('weeklyAmount');
  const watchMonthlyAmount = watch('monthlyAmount');
  const watchStartDate = watch('startDate');
  const watchInterestRate = watch('interestRate');

  // Live Daily Interest Calculations for Adjustment Loan Preview
  const adjustmentPrincipal = Number(watchAmountGiven) || 10000;
  const adjustmentRate = watchInterestRate !== undefined ? Number(watchInterestRate) : 6;
  const monthlyInterestAmt = adjustmentPrincipal * (adjustmentRate / 100);
  const dailyInterestRateAmt = Math.round((monthlyInterestAmt / 30) * 100) / 100;

  // Automatically update Total Collection Target & End Date when collection amount, duration or start date changes
  useEffect(() => {
    if (watchLoanType === 'daily') {
      const perDay = Number(watchDailyAmount) || 0;
      const days = Number(watchWorkingDays) || 0;
      const target = Math.round(perDay * days * 100) / 100;
      setValue('totalCollectionAmount', target);

      if (watchStartDate && days > 0) {
        const start = new Date(watchStartDate);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + days);
          setValue('endDate', end.toISOString().split('T')[0]);
        }
      }
    } else if (watchLoanType === 'weekly') {
      const perWeek = Number(watchWeeklyAmount) || 0;
      const weeks = Number(watchTotalWeeks) || 0;
      const target = Math.round(perWeek * weeks * 100) / 100;
      setValue('totalCollectionAmount', target);

      if (watchStartDate && weeks > 0) {
        const start = new Date(watchStartDate);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + weeks * 7);
          setValue('endDate', end.toISOString().split('T')[0]);
        }
      }
    } else if (watchLoanType === 'monthly') {
      const perMonth = Number(watchMonthlyAmount) || 0;
      const months = Number(watchTotalMonths) || 0;
      const target = Math.round(perMonth * months * 100) / 100;
      setValue('totalCollectionAmount', target);

      if (watchStartDate && months > 0) {
        const start = new Date(watchStartDate);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setMonth(end.getMonth() + months);
          setValue('endDate', end.toISOString().split('T')[0]);
        }
      }
    } else if (watchLoanType === 'adjustment') {
      const given = Number(watchAmountGiven) || 0;
      setValue('totalCollectionAmount', given);

      if (watchStartDate) {
        const start = new Date(watchStartDate);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
          setValue('endDate', end.toISOString().split('T')[0]);
        }
      }
    }
  }, [
    watchLoanType,
    watchDailyAmount,
    watchWeeklyAmount,
    watchMonthlyAmount,
    watchWorkingDays,
    watchTotalWeeks,
    watchTotalMonths,
    watchAmountGiven,
    watchStartDate,
    setValue,
  ]);

  // Reset form state when modal opens or loan changes
  useEffect(() => {
    if (isOpen) {
      if (loan) {
        reset({
          customerId: loan.customerId,
          loanType: loan.loanType,
          city: loan.city || '',
          amountGiven: loan.amountGiven,
          totalCollectionAmount: loan.totalCollectionAmount,
          interestRate: loan.interestRate !== undefined ? loan.interestRate : 6,
          workingDays: loan.workingDays || 100,
          totalWeeks: loan.totalWeeks || 10,
          totalMonths: loan.totalMonths || 6,
          dailyAmount: loan.dailyAmount || 120,
          weeklyAmount: loan.weeklyAmount || 1200,
          monthlyAmount: loan.monthlyAmount || 2000,
          startDate: loan.startDate,
          endDate: loan.endDate,
          status: loan.isClosed ? 'closed' : 'active',
        });
      } else {
        reset({
          customerId: customers[0]?.id || '',
          loanType: 'daily',
          city: '',
          amountGiven: 10000,
          totalCollectionAmount: 12000,
          interestRate: 6,
          workingDays: 100,
          totalWeeks: 10,
          totalMonths: 10,
          dailyAmount: 120,
          weeklyAmount: 1200,
          monthlyAmount: 2000,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
        });
      }
    }
  }, [isOpen, loan, customers, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Loan Contract' : 'Create New Loan Contract'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Customer <span className="text-rose-500">*</span>
          </label>
          <select
            id="customerId"
            {...register('customerId')}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerId || 'N/A'} - {c.customerName} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-[11px] text-rose-500">{errors.customerId.message}</p>}
        </div>

        {/* Loan Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Loan Module Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setValue('loanType', 'daily')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                watchLoanType === 'daily'
                  ? 'bg-[#FF7A00] text-white border-[#FF7A00] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 mb-1" />
              Daily Loan
            </button>

            <button
              type="button"
              onClick={() => setValue('loanType', 'weekly')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                watchLoanType === 'weekly'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-4 h-4 mb-1" />
              Weekly Loan
            </button>

            <button
              type="button"
              onClick={() => setValue('loanType', 'monthly')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                watchLoanType === 'monthly'
                  ? 'bg-[#FF7A00] text-white border-[#FF7A00] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4 mb-1" />
              Monthly Loan
            </button>

            <button
              type="button"
              onClick={() => setValue('loanType', 'adjustment')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                watchLoanType === 'adjustment'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mb-1" />
              Adjustment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Place / City */}
          <div className="space-y-1.5">
            <label htmlFor="city" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
              Place / City
            </label>
            <Input
              id="city"
              placeholder="e.g. Hyderabad, Vijayawada"
              {...register('city')}
              error={errors.city?.message}
            />
          </div>
        </div>

        {/* Dynamic Fields based on Loan Type */}
        {watchLoanType === 'daily' && (
          <div className="p-3.5 rounded-xl bg-[#FF7A00]/5 border border-[#FF7A00]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF7A00] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Daily Collection Loan Parameters
              </span>
              <Badge variant="outline" className="border-[#FF7A00] text-[#FF7A00]">
                Daily Installment
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Amount Given (Principal)"
                type="number"
                prefix="₹"
                {...register('amountGiven', { valueAsNumber: true })}
                error={errors.amountGiven?.message}
              />
              <Input
                label="Daily Amount (₹/day)"
                type="number"
                prefix="₹"
                {...register('dailyAmount', { valueAsNumber: true })}
                error={errors.dailyAmount?.message}
              />
              <Input
                label="Working Days"
                type="number"
                suffix="Days"
                {...register('workingDays', { valueAsNumber: true })}
                error={errors.workingDays?.message}
              />
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Total Target Collection:</span>
              <span className="text-sm font-bold text-[#FF7A00]">{formatCurrency(watchTotalCollection || 0)}</span>
            </div>
          </div>
        )}

        {watchLoanType === 'weekly' && (
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                Weekly Collection Loan Parameters
              </span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                Weekly Installment
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Amount Given (Principal)"
                type="number"
                prefix="₹"
                {...register('amountGiven', { valueAsNumber: true })}
                error={errors.amountGiven?.message}
              />
              <Input
                label="Weekly Amount (₹/week)"
                type="number"
                prefix="₹"
                {...register('weeklyAmount', { valueAsNumber: true })}
                error={errors.weeklyAmount?.message}
              />
              <Input
                label="Total Weeks"
                type="number"
                suffix="Weeks"
                {...register('totalWeeks', { valueAsNumber: true })}
                error={errors.totalWeeks?.message}
              />
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Total Target Collection:</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(watchTotalCollection || 0)}</span>
            </div>
          </div>
        )}

        {watchLoanType === 'monthly' && (
          <div className="p-3.5 rounded-xl bg-[#FF7A00]/5 border border-[#FF7A00]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF7A00] flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                Monthly Collection Loan Parameters
              </span>
              <Badge variant="outline" className="border-[#FF7A00] text-[#FF7A00]">
                Monthly Installment
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Amount Given (Principal)"
                type="number"
                prefix="₹"
                {...register('amountGiven', { valueAsNumber: true })}
                error={errors.amountGiven?.message}
              />
              <Input
                label="Monthly Amount (₹/month)"
                type="number"
                prefix="₹"
                {...register('monthlyAmount', { valueAsNumber: true })}
                error={errors.monthlyAmount?.message}
              />
              <Input
                label="Total Months"
                type="number"
                suffix="Months"
                {...register('totalMonths', { valueAsNumber: true })}
                error={errors.totalMonths?.message}
              />
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Total Target Collection:</span>
              <span className="text-sm font-bold text-[#FF7A00]">{formatCurrency(watchTotalCollection || 0)}</span>
            </div>
          </div>
        )}

        {watchLoanType === 'adjustment' && (
          <div className="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" />
                Adjustment / Flexi Interest Loan Parameters
              </span>
              <Badge variant="outline" className="border-violet-500 text-violet-600 dark:text-violet-400">
                Daily Simple Interest
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Principal Disbursed (₹)"
                type="number"
                prefix="₹"
                {...register('amountGiven', { valueAsNumber: true })}
                error={errors.amountGiven?.message}
              />
              <Input
                label="Monthly Interest Rate (%)"
                type="number"
                step="0.1"
                suffix="%"
                icon={<Percent className="w-4 h-4 text-violet-500" />}
                {...register('interestRate', { valueAsNumber: true })}
                error={errors.interestRate?.message}
              />
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500">Monthly Interest Payable:</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">{formatCurrency(monthlyInterestAmt)} / month</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500">Daily Accrued Interest Speed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">~{formatCurrency(dailyInterestRateAmt)} / day</span>
              </div>
            </div>
          </div>
        )}

        {/* Dates Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start / Disbursement Date"
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
          />
          <Input
            label="Maturity / Target End Date"
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading}>
            {isEditing ? 'Save Loan Changes' : 'Disburse Loan Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
