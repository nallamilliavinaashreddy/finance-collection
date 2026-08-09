'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { stampSchema, StampFormData } from '@/lib/validations/stamp';
import { Stamp, Customer, Loan } from '@/types';
import { createStamp, updateStamp } from '@/lib/actions/stamps';
import { getCustomers } from '@/lib/actions/customers';
import { getLoans } from '@/lib/actions/loans';
import { useToast } from '@/components/providers/toast-provider';
import { Calendar, DollarSign, Tag, User, Hash, FileSignature, Landmark } from 'lucide-react';

interface StampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stampToEdit?: Stamp | null;
}

const STAMP_TYPES = [
  'Agreement Stamp',
  'Promissory Note',
  'Legal Affidavit',
  'e-Stamp',
  'Revenue Stamp',
  'Misc',
];

export function StampModal({
  isOpen,
  onClose,
  onSuccess,
  stampToEdit,
}: StampModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(stampToEdit);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoans, setCustomerLoans] = useState<Loan[]>([]);

  const defaultDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StampFormData>({
    resolver: zodResolver(stampSchema),
    defaultValues: {
      customerId: '',
      loanId: '',
      stampDate: defaultDate,
      stampType: 'Agreement Stamp',
      stampNumber: '',
      amount: 100,
      vendor: '',
      remarks: '',
    },
  });

  const watchCustomerId = watch('customerId');

  // Load Customers
  useEffect(() => {
    if (isOpen) {
      getCustomers().then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      });
    }
  }, [isOpen]);

  // Load Loans for selected Customer
  useEffect(() => {
    if (isOpen && watchCustomerId) {
      getLoans('', 'all', 'all').then((res) => {
        if (res.success && res.data) {
          const custL = res.data.filter((l) => l.customerId === watchCustomerId);
          setCustomerLoans(custL);
        }
      });
    } else {
      setCustomerLoans([]);
    }
  }, [isOpen, watchCustomerId]);

  useEffect(() => {
    if (isOpen) {
      if (stampToEdit) {
        reset({
          customerId: stampToEdit.customerId,
          loanId: stampToEdit.loanId || '',
          stampDate: stampToEdit.stampDate,
          stampType: stampToEdit.stampType,
          stampNumber: stampToEdit.stampNumber || '',
          amount: stampToEdit.amount,
          vendor: stampToEdit.vendor || '',
          remarks: stampToEdit.remarks || '',
        });
      } else {
        reset({
          customerId: customers[0]?.id || '',
          loanId: '',
          stampDate: defaultDate,
          stampType: 'Agreement Stamp',
          stampNumber: '',
          amount: 100,
          vendor: '',
          remarks: '',
        });
      }
    }
  }, [isOpen, stampToEdit, customers, reset, defaultDate]);

  const onSubmit = async (formData: StampFormData) => {
    try {
      if (isEditing && stampToEdit) {
        const res = await updateStamp(stampToEdit.id, formData);
        if (res.success) {
          showToast('Stamp record updated successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update stamp record', 'error');
        }
      } else {
        const res = await createStamp(formData);
        if (res.success) {
          showToast('New stamp recorded successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to create stamp record', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while saving stamp record', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Stamp Income Record' : 'Record Stamp Income'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {c.customerId} - {c.customerName} ({c.mobileNumber})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-[11px] text-rose-500">{errors.customerId.message}</p>}
          </div>

          {/* Associated Loan (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="loanId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Associated Loan (Optional)
            </label>
            <select
              id="loanId"
              {...register('loanId')}
              disabled={!watchCustomerId}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] disabled:opacity-50"
            >
              <option value="">-- General Customer Stamp --</option>
              {customerLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loanType.toUpperCase()} - Given ₹{l.amountGiven} ({l.startDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stamp Date */}
          <div className="space-y-1.5">
            <label htmlFor="stampDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Stamp Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="stampDate"
                type="date"
                className="pl-9 h-10"
                {...register('stampDate')}
              />
            </div>
            {errors.stampDate && <p className="text-[11px] text-rose-500">{errors.stampDate.message}</p>}
          </div>

          {/* Stamp Type */}
          <div className="space-y-1.5">
            <label htmlFor="stampType" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Stamp Type <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                id="stampType"
                {...register('stampType')}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                {STAMP_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            {errors.stampType && <p className="text-[11px] text-rose-500">{errors.stampType.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount (₹) Input with min={1} step={1} */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Stamp Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 100, 250, 500"
                className="pl-9 h-10 font-bold text-emerald-600 dark:text-emerald-400"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            <p className="text-[10px] text-slate-500">Stamp charge collected from customer</p>
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount.message}</p>}
          </div>

          {/* Stamp Serial / Number */}
          <div className="space-y-1.5">
            <label htmlFor="stampNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Stamp Serial / Number (Optional)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="stampNumber"
                placeholder="e.g. AP-940291, ST-4920"
                className="pl-9 h-10"
                {...register('stampNumber')}
              />
            </div>
          </div>
        </div>

        {/* Vendor */}
        <div className="space-y-1.5">
          <label htmlFor="vendor" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Vendor / Stamp Paper Vendor (Optional)
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="vendor"
              placeholder="e.g. Laxmi Stamp Vendor, Registrar Office"
              className="pl-9 h-10"
              {...register('vendor')}
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
            placeholder="e.g. 100 Rs non-judicial agreement stamp"
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
            {isEditing ? 'Save Changes' : 'Record Stamp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

