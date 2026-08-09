'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormData } from '@/lib/validations/customer';
import { Customer } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Phone, MapPin, Hash, Sparkles } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  customer?: Customer | null;
  isLoading?: boolean;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isLoading = false,
}: CustomerModalProps) {
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      mobileNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        customerId: customer.customerId,
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber,
        address: customer.address || '',
      });
    } else {
      reset({
        customerId: '',
        customerName: '',
        mobileNumber: '',
        address: '',
      });
    }
  }, [customer, reset, isOpen]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer Details' : 'Add New Customer'}
      description={
        isEditing
          ? 'Update the profile information and contact details for this customer.'
          : 'Create a new customer profile. Customer ID must be manually specified and unique.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 py-2">
        {/* Customer ID Field (Manual, Unique, Required) */}
        <div>
          <Input
            label="Customer ID (Manual Unique Identifier) *"
            placeholder="e.g. CUST-1001"
            leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
            error={errors.customerId?.message}
            helperText={
              isEditing
                ? 'Customer ID serves as the unique identifier across loans and collections.'
                : 'Enter a unique manual ID (e.g. CUST-1001). Auto-generation is disabled.'
            }
            {...register('customerId')}
          />
        </div>

        {/* Customer Name Field */}
        <div>
          <Input
            label="Customer Name *"
            placeholder="e.g. Robert Vance"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            error={errors.customerName?.message}
            {...register('customerName')}
          />
        </div>

        {/* Mobile Number Field */}
        <div>
          <Input
            label="Mobile Number *"
            placeholder="e.g. +1 (555) 019-2834"
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            error={errors.mobileNumber?.message}
            {...register('mobileNumber')}
          />
        </div>

        {/* Address Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Address (Optional)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. 124 Financial Parkway, Suite 400, New York, NY"
              className="w-full p-3 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] placeholder:text-slate-400"
              {...register('address')}
            />
          </div>
          {errors.address && (
            <p className="text-xs text-rose-500 font-medium">{errors.address.message}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

