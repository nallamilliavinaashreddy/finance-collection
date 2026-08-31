'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { employeeSchema, EmployeeFormData } from '@/lib/validations/employee';
import { Employee } from '@/types';
import { createEmployee, updateEmployee } from '@/lib/actions/employees';
import { useToast } from '@/components/providers/toast-provider';
import { User, Phone, MapPin, DollarSign, FileText, UserCheck } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
}

export function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}: AddEmployeeModalProps) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeName: '',
      mobileNumber: '',
      address: '',
      monthlySalary: 25000,
      status: 'active',
      remarks: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        reset({
          employeeName: employeeToEdit.employeeName,
          mobileNumber: employeeToEdit.mobileNumber || '',
          address: employeeToEdit.address || '',
          monthlySalary: employeeToEdit.monthlySalary,
          status: employeeToEdit.status,
          remarks: employeeToEdit.remarks || '',
        });
      } else {
        reset({
          employeeName: '',
          mobileNumber: '',
          address: '',
          monthlySalary: 25000,
          status: 'active',
          remarks: '',
        });
      }
    }
  }, [isOpen, employeeToEdit, reset]);

  const onSubmit = async (formData: EmployeeFormData) => {
    try {
      if (employeeToEdit) {
        const res = await updateEmployee(employeeToEdit.id, formData);
        if (res.success) {
          showToast(`Employee "${formData.employeeName}" updated successfully!`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update employee', 'error');
        }
      } else {
        const res = await createEmployee(formData);
        if (res.success) {
          showToast(`Employee "${formData.employeeName}" created successfully!`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to create employee', 'error');
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
      title={employeeToEdit ? 'Edit Employee Details' : 'Add New Employee'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Employee Name */}
        <div className="space-y-1.5">
          <label htmlFor="employeeName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Employee Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="employeeName"
              placeholder="e.g. Ramesh Kumar / Srinivasa Rao"
              className="pl-9 h-10 font-medium"
              {...register('employeeName')}
            />
          </div>
          {errors.employeeName && <p className="text-[11px] text-rose-500">{errors.employeeName.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label htmlFor="mobileNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="mobileNumber"
                placeholder="e.g. 9848012345"
                className="pl-9 h-10 font-mono"
                {...register('mobileNumber')}
              />
            </div>
          </div>

          {/* Monthly Salary */}
          <div className="space-y-1.5">
            <label htmlFor="monthlySalary" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Salary (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="monthlySalary"
                type="number"
                min={0.01}
                step="0.01"
                placeholder="e.g. 25000"
                className="pl-9 h-10 font-bold text-emerald-600 dark:text-emerald-400"
                {...register('monthlySalary', { valueAsNumber: true })}
              />
            </div>
            {errors.monthlySalary && <p className="text-[11px] text-rose-500">{errors.monthlySalary.message}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Address / Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="address"
              placeholder="e.g. Main Road, Kakinada"
              className="pl-9 h-10"
              {...register('address')}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Status <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              id="status"
              {...register('status')}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {errors.status && <p className="text-[11px] text-rose-500">{errors.status.message}</p>}
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
              placeholder="e.g. Office Collection Staff"
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
          <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<UserCheck className="w-4 h-4" />}>
            {employeeToEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

