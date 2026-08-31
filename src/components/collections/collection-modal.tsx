'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collectionSchema, CollectionFormData } from '@/lib/validations/collection';
import { Customer, Loan } from '@/types';
import { getCustomers } from '@/lib/actions/customers';
import { getLoans } from '@/lib/actions/loans';
import { formatCurrency, getWeekDateRange, getMonthDateRange } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  User,
  IndianRupee,
  Calendar,
  AlertCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  CalendarDays,
  CalendarRange,
  SlidersHorizontal,
} from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CollectionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CollectionModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allActiveLoans, setAllActiveLoans] = useState<Loan[]>([]);
  const [customerActiveLoans, setCustomerActiveLoans] = useState<Loan[]>([]);
  const [selectedLoanObj, setSelectedLoanObj] = useState<Loan | null>(null);
  const [fetchingData, setFetchingData] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      customerId: '',
      loanId: '',
      paymentDate: todayStr,
      amountPaid: 0,
      remarks: '',
    },
  });

  const watchCustomerId = useWatch({ control, name: 'customerId' });
  const watchLoanId = useWatch({ control, name: 'loanId' });
  const watchPaymentDate = useWatch({ control, name: 'paymentDate' });

  // Helper to calculate default collection target based on loan type
  const getTargetAmountForLoan = (loan: Loan): number => {
    const type = loan.loanType || 'daily';
    if (type === 'daily') return Math.round(loan.dailyAmount || (loan.totalCollectionAmount / (loan.workingDays || 100)));
    if (type === 'weekly') return Math.round(loan.weeklyAmount || (loan.totalCollectionAmount / (loan.totalWeeks || 10)));
    if (type === 'monthly') return Math.round(loan.monthlyAmount || (loan.totalCollectionAmount / (loan.totalMonths || 6)));
    return Math.round(loan.balanceAmount || loan.totalCollectionAmount);
  };

  // Load Customers and Active Loans from Supabase when Modal Opens
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        setFetchingData(true);
        const [custRes, loansRes] = await Promise.all([getCustomers(), getLoans('', 'active')]);

        if (custRes.success && custRes.data) {
          setCustomers(custRes.data);
        }
        if (loansRes.success && loansRes.data) {
          const activeOnly = loansRes.data.filter((l) => !l.isClosed && l.status === 'active');
          setAllActiveLoans(activeOnly);
        }
        setFetchingData(false);
      };
      loadInitialData();

      reset({
        customerId: '',
        loanId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amountPaid: 0,
        remarks: '',
      });
      setSelectedLoanObj(null);
    }
  }, [isOpen, reset]);

  // Filter Active Loans when selected Customer changes
  useEffect(() => {
    if (watchCustomerId) {
      const filteredLoans = allActiveLoans.filter((l) => l.customerId === watchCustomerId);
      setCustomerActiveLoans(filteredLoans);

      if (filteredLoans.length === 1) {
        const autoLoan = filteredLoans[0];
        setValue('loanId', autoLoan.id, { shouldValidate: true });
        setSelectedLoanObj(autoLoan);
        setValue('amountPaid', getTargetAmountForLoan(autoLoan), { shouldValidate: true });
      } else {
        setValue('loanId', '');
        setSelectedLoanObj(null);
        setValue('amountPaid', 0);
      }
    } else {
      setCustomerActiveLoans([]);
      setSelectedLoanObj(null);
    }
  }, [watchCustomerId, allActiveLoans, setValue]);

  // Sync selected Loan object when Loan ID changes
  useEffect(() => {
    if (watchLoanId) {
      const foundLoan = customerActiveLoans.find((l) => l.id === watchLoanId);
      if (foundLoan) {
        setSelectedLoanObj(foundLoan);
        if (!control._formValues.amountPaid || control._formValues.amountPaid === 0) {
          setValue('amountPaid', getTargetAmountForLoan(foundLoan), { shouldValidate: true });
        }
      }
    } else {
      setSelectedLoanObj(null);
    }
  }, [watchLoanId, customerActiveLoans, setValue, control._formValues.amountPaid]);

  // Compute date ranges
  const weekRange = React.useMemo(() => {
    if (!watchPaymentDate) return null;
    return getWeekDateRange(watchPaymentDate);
  }, [watchPaymentDate]);

  const handleFormSubmit = async (data: CollectionFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Loan Collection"
      description="Record collection for an Active loan (Daily, Weekly, Monthly, or Adjustment)."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 py-2">
        {/* Customer Select Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Customer (by Customer ID) *
          </label>
          <select
            value={control._formValues.customerId || ''}
            onChange={(e) => setValue('customerId', e.target.value, { shouldValidate: true })}
            className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00]"
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerId} - {c.customerName} ({c.mobileNumber})
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="text-xs text-rose-500 font-medium">{errors.customerId.message}</p>
          )}
        </div>

        {/* Active Loan Selection */}
        {watchCustomerId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Active Loan *
            </label>
            {customerActiveLoans.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs">
                No active loans found for this customer. Collections can only be recorded for Active loans.
              </div>
            ) : (
              <select
                value={control._formValues.loanId || ''}
                onChange={(e) => setValue('loanId', e.target.value, { shouldValidate: true })}
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00]"
              >
                <option value="">-- Choose Active Loan --</option>
                {customerActiveLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.loanType.toUpperCase()}] {l.city ? `City: ${l.city} | ` : ''}Target: {formatCurrency(l.totalCollectionAmount)} | Bal: {formatCurrency(l.balanceAmount || (l.totalCollectionAmount - (l.collectedAmount || 0)))}
                  </option>
                ))}
              </select>
            )}
            {errors.loanId && (
              <p className="text-xs text-rose-500 font-medium">{errors.loanId.message}</p>
            )}
          </div>
        )}

        {/* Selected Loan Details & Progress Shell */}
        {selectedLoanObj && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="uppercase text-[10px]">
                  {selectedLoanObj.loanType} Loan
                </Badge>
                {selectedLoanObj.city && (
                  <span className="font-semibold text-[#FF7A00] dark:text-[#FF7A00] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF7A00]" />
                    {selectedLoanObj.city}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Target: {formatCurrency(getTargetAmountForLoan(selectedLoanObj))}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1 border-t border-[#262626]/60 dark:border-[#262626] pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Target</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(selectedLoanObj.totalCollectionAmount)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Collected So Far</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedLoanObj.collectedAmount || 0)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Remaining Balance</span>
                <span className="text-xs font-bold text-[#FF7A00] dark:text-[#FF7A00]">
                  {formatCurrency(
                    selectedLoanObj.balanceAmount !== undefined
                      ? selectedLoanObj.balanceAmount
                      : selectedLoanObj.totalCollectionAmount - (selectedLoanObj.collectedAmount || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collection Date & Amount Collected */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Collection Date *"
              type="date"
              leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
              error={errors.paymentDate?.message}
              {...register('paymentDate')}
            />
          </div>

          <Input
            label="Amount Collected (in ₹) *"
            type="number"
            step="1"
            placeholder="120"
            leftIcon={<IndianRupee className="w-4 h-4 text-slate-400" />}
            error={errors.amountPaid?.message}
            {...register('amountPaid', { valueAsNumber: true })}
          />
        </div>

        {/* Type-Specific Rule Notice Banner */}
        {selectedLoanObj && (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs">
            <Clock className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
            <span>
              {selectedLoanObj.loanType === 'daily' && (
                <>
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">Daily Loan Policy:</strong> Sundays are holidays. Only 1 collection allowed per date.
                </>
              )}
              {selectedLoanObj.loanType === 'weekly' && (
                <>
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">Weekly Loan Policy:</strong> 1 collection allowed per calendar week (Monday to Sunday) on any day.
                </>
              )}
              {selectedLoanObj.loanType === 'monthly' && (
                <>
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">Monthly Loan Policy:</strong> 1 collection allowed per calendar month on any day.
                </>
              )}
              {selectedLoanObj.loanType === 'adjustment' && (
                <>
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">Adjustment Loan Policy:</strong> Flexible collection schedule.
                </>
              )}
            </span>
          </div>
        )}

        {/* Remarks Input */}
        <Input
          label="Remarks (Optional)"
          type="text"
          placeholder="e.g. Regular collection payment"
          {...register('remarks')}
        />

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={fetchingData}
          >
            Record Collection
          </Button>
        </div>
      </form>
    </Modal>
  );
}

