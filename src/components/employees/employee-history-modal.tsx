'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Employee, EmployeeSalary } from '@/types';
import { getEmployeeSalaries } from '@/lib/actions/employees';
import { formatCurrency, formatDate } from '@/lib/utils';
import { History, RefreshCw, User } from 'lucide-react';

interface EmployeeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function EmployeeHistoryModal({
  isOpen,
  onClose,
  employee,
}: EmployeeHistoryModalProps) {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!employee) return;
    setIsLoading(true);
    try {
      const res = await getEmployeeSalaries(employee.id);
      if (res.success && res.data) {
        setSalaries(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching employee salary history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (isOpen && employee) {
      fetchHistory();
    }
  }, [isOpen, employee, fetchHistory]);

  if (!employee) return null;

  const columns: ColumnDef<EmployeeSalary>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => (
        <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
          {formatDate(row.original.paymentDate)}
        </span>
      ),
    },
    {
      accessorKey: 'salaryMonth',
      header: 'Salary Month',
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold text-xs">
          {row.original.salaryMonth}
        </Badge>
      ),
    },
    {
      accessorKey: 'salaryAmount',
      header: 'Base Salary Paid (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatCurrency(row.original.salaryAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'bonus',
      header: 'Bonus (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          {row.original.bonus > 0 ? `+${formatCurrency(row.original.bonus)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'deduction',
      header: 'Deduction (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">
          {row.original.deduction > 0 ? `-${formatCurrency(row.original.deduction)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'netSalaryPaid',
      header: 'Net Salary Paid (₹)',
      cell: ({ row }) => (
        <span className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.netSalaryPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Mode',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.original.paymentMode}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[180px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Employee Salary Ledger - ${employee.employeeName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Employee Summary Card */}
        <div className="p-3.5 rounded-xl bg-[#111111] dark:bg-[#111111] border border-[#262626] dark:border-[#262626] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#FF7A00]" />
              {employee.employeeName} {employee.mobileNumber && `(${employee.mobileNumber})`}
            </span>
            <Badge variant={employee.status === 'active' ? 'success' : 'outline'} className="text-[10px]">
              {employee.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#262626]/60 dark:border-[#262626]">
            <span className="text-slate-500">
              Monthly Base Salary: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(employee.monthlySalary)}</strong>
            </span>
            <span className="text-slate-500">
              Total Salary Transactions: <strong className="text-[#FF7A00] dark:text-[#FF7A00]">{salaries.length} Payments</strong>
            </span>
          </div>
        </div>

        {/* Refresh & Title */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#FF7A00]" />
            Salary Payment History ({salaries.length} records)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3 h-3" />}
            className="h-7 text-xs"
          >
            Refresh
          </Button>
        </div>

        {/* Salary Ledger Table */}
        <DataTable
          columns={columns}
          data={salaries}
          emptyText={isLoading ? 'Loading salary history...' : 'No salary payments recorded yet.'}
          pageSize={6}
        />

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

