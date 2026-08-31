'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { employeeSalarySchema, EmployeeSalaryFormData } from '@/lib/validations/employee';
import { Employee } from '@/types';
import { recordEmployeeSalary } from '@/lib/actions/employees';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency } from '@/lib/utils';
import { User, Calendar, DollarSign, CreditCard, FileText, Receipt, PlusCircle, MinusCircle } from 'lucide-react';

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  selectedEmployeeId?: string;
}

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque'];

export function PaySalaryModal({
  isOpen,
  onClose,
  onSuccess,
  employees,
  selectedEmployeeId,
}: PaySalaryModalProps) {
  const { showToast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultMonth = useMemo(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeSalaryFormData>({
    resolver: zodResolver(employeeSalarySchema),
    defaultValues: {
      employeeId: selectedEmployeeId || '',
      salaryMonth: defaultMonth,
      salaryAmount: 0,
      bonus: 0,
      deduction: 0,
      paymentDate: defaultDate,
      paymentMode: 'Bank Transfer',
      remarks: '',
    },
  });

  const selectedEmpId = watch('employeeId');
  const salaryAmount = watch('salaryAmount') || 0;
  const bonus = watch('bonus') || 0;
  const deduction = watch('deduction') || 0;

  // Calculate Net Salary Paid automatically
  const netSalaryPaid = useMemo(() => {
    return Math.max(0, salaryAmount + bonus - deduction);
  }, [salaryAmount, bonus, deduction]);

  // Find active selected employee
  const currentEmp = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || null;
  }, [employees, selectedEmpId]);

  useEffect(() => {
    if (isOpen) {
      const empId = selectedEmployeeId || (employees.length > 0 ? employees[0].id : '');
      const initialEmp = employees.find((e) => e.id === empId);

      reset({
        employeeId: empId,
        salaryMonth: defaultMonth,
        salaryAmount: initialEmp ? initialEmp.monthlySalary : 0,
        bonus: 0,
        deduction: 0,
        paymentDate: defaultDate,
        paymentMode: 'Bank Transfer',
        remarks: '',
      });
    }
  }, [isOpen, selectedEmployeeId, employees, reset, defaultMonth, defaultDate]);

  const handleEmployeeChange = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (target) {
      setValue('salaryAmount', target.monthlySalary);
    }
  };

  const onSubmit = async (formData: EmployeeSalaryFormData) => {
    try {
      const res = await recordEmployeeSalary(formData);
      if (res.success) {
        showToast(
          `Salary paid successfully to ${currentEmp?.employeeName || 'employee'}! Investment Khata updated.`,
          'success'
        );
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record salary payment', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Employee Salary Payment"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] flex items-center justify-between text-xs text-[#FF7A00] text-white">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#FF7A00] shrink-0" />
            <span>
              {currentEmp
                ? `${currentEmp.employeeName} • Monthly Base Salary: ${formatCurrency(currentEmp.monthlySalary)}`
                : 'Select an employee to process salary'}
            </span>
          </div>
          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
            Net Paid: {formatCurrency(netSalaryPaid)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Employee */}
          <div className="space-y-1.5">
            <label htmlFor="employeeId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              id="employeeId"
              {...register('employeeId')}
              onChange={(e) => {
                register('employeeId').onChange(e);
                handleEmployeeChange(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="" disabled>
                -- Select Employee --
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName} ({formatCurrency(emp.monthlySalary)}/mo)
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-[11px] text-rose-500">{errors.employeeId.message}</p>}
          </div>

          {/* Salary Month */}
          <div className="space-y-1.5">
            <label htmlFor="salaryMonth" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Salary Month <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="salaryMonth"
                placeholder="e.g. August 2026"
                className="pl-9 h-10"
                {...register('salaryMonth')}
              />
            </div>
            {errors.salaryMonth && <p className="text-[11px] text-rose-500">{errors.salaryMonth.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Base Salary Amount */}
          <div className="space-y-1.5">
            <label htmlFor="salaryAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Base Salary (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="salaryAmount"
                type="number"
                min={0}
                step="0.01"
                className="pl-9 h-10 font-semibold"
                {...register('salaryAmount', { valueAsNumber: true })}
              />
            </div>
            {errors.salaryAmount && <p className="text-[11px] text-rose-500">{errors.salaryAmount.message}</p>}
          </div>

          {/* Bonus (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="bonus" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bonus / Incentive (₹)
            </label>
            <div className="relative">
              <PlusCircle className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
              <Input
                id="bonus"
                type="number"
                min={0}
                step="0.01"
                className="pl-9 h-10 text-emerald-600 font-semibold"
                {...register('bonus', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Deduction (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="deduction" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deduction (₹)
            </label>
            <div className="relative">
              <MinusCircle className="w-4 h-4 absolute left-3 top-3 text-rose-500" />
              <Input
                id="deduction"
                type="number"
                min={0}
                step="0.01"
                className="pl-9 h-10 text-rose-600 font-semibold"
                {...register('deduction', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Date */}
          <div className="space-y-1.5">
            <label htmlFor="paymentDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="paymentDate"
                type="date"
                className="pl-9 h-10"
                {...register('paymentDate')}
              />
            </div>
            {errors.paymentDate && <p className="text-[11px] text-rose-500">{errors.paymentDate.message}</p>}
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

        {/* Remarks */}
        <div className="space-y-1.5">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remarks (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="remarks"
              placeholder="e.g. Salary paid via GPay / Bank Transfer"
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
          <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<Receipt className="w-4 h-4" />}>
            Confirm Salary Payment ({formatCurrency(netSalaryPaid)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}

