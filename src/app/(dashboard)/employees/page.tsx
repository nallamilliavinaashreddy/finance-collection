'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/utils';
import {
  getEmployees,
  getEmployeeMetrics,
  deleteEmployee,
} from '@/lib/actions/employees';
import { Employee, EmployeeMetrics } from '@/types';
import { AddEmployeeModal } from '@/components/employees/add-employee-modal';
import { PaySalaryModal } from '@/components/employees/pay-salary-modal';
import { EmployeeHistoryModal } from '@/components/employees/employee-history-modal';
import { useToast } from '@/components/providers/toast-provider';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Database,
  Receipt,
  History,
  Pencil,
  Trash2,
  DollarSign,
  UserCheck,
  Building2,
  Filter,
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [metrics, setMetrics] = useState<EmployeeMetrics>({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyPayrollCost: 0,
    totalSalaryPaidYTD: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmpForEdit, setSelectedEmpForEdit] = useState<Employee | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedEmpIdForPay, setSelectedEmpIdForPay] = useState<string | undefined>(undefined);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEmpForHistory, setSelectedEmpForHistory] = useState<Employee | null>(null);

  const { showToast } = useToast();

  const fetchEmployeeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, metRes] = await Promise.all([
        getEmployees(searchQuery, statusFilter),
        getEmployeeMetrics(),
      ]);

      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      } else {
        showToast(empRes.error || 'Failed to fetch employees', 'error');
      }

      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err: any) {
      showToast('Error fetching employee data from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, showToast]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleDeleteConfirm = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to delete employee "${emp.employeeName}"?`)) return;
    try {
      const res = await deleteEmployee(emp.id);
      if (res.success) {
        showToast(`Employee "${emp.employeeName}" deleted successfully`, 'success');
        fetchEmployeeData();
      } else {
        showToast(res.error || 'Failed to delete employee', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting employee', 'error');
    }
  };

  // DataTable Columns
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'employeeName',
      header: 'Employee Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#FF7A00]" />
            {row.original.employeeName}
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {row.original.mobileNumber ? `📱 ${row.original.mobileNumber}` : row.original.address || 'No phone'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'monthlySalary',
      header: 'Monthly Base Salary',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.monthlySalary)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'active' ? 'success' : 'outline'}
          className="capitalize text-[10px]"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[200px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {/* Pay Salary Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedEmpIdForPay(row.original.id);
              setIsPayModalOpen(true);
            }}
            disabled={row.original.status === 'inactive'}
            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Pay Salary to Employee"
          >
            <Receipt className="w-3.5 h-3.5 mr-1" />
            Pay Salary
          </Button>

          {/* Ledger History Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEmpForHistory(row.original);
              setIsHistoryModalOpen(true);
            }}
            className="h-8 px-2 text-slate-600 hover:text-[#FF7A00]"
            title="View Salary Payment Ledger"
          >
            <History className="w-3.5 h-3.5" />
          </Button>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEmpForEdit(row.original);
              setIsAddModalOpen(true);
            }}
            className="h-8 px-2 text-[#FF7A00] hover:text-[#FF7A00]"
            title="Edit Employee"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteConfirm(row.original)}
            className="h-8 px-2 text-rose-600 hover:text-rose-700"
            title="Delete Employee"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#FF7A00]" />
              Employees & Payroll
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-[#A3A3A3]">
            Simple employee directory, monthly salary payment tracking & automatic Investment Khata expense entries.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployeeData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            onClick={() => {
              setSelectedEmpIdForPay(undefined);
              setIsPayModalOpen(true);
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            leftIcon={<Receipt className="w-4 h-4" />}
          >
            Pay Salary
          </Button>

          <Button
            onClick={() => {
              setSelectedEmpForEdit(null);
              setIsAddModalOpen(true);
            }}
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards (4 Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <Card className="p-4 flex flex-col justify-between border-[#262626] bg-[#111111]">
          <span className="text-xs font-semibold text-[#FF7A00] uppercase tracking-wider">
            Total Staff
          </span>
          <div className="text-2xl font-bold text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : `${metrics.totalEmployees} Employees`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total registered staff</p>
        </Card>

        {/* Card 2: Active Employees */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Active Staff
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : `${metrics.activeEmployees} Active`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Currently active employees</p>
        </Card>

        {/* Card 3: Monthly Payroll Cost */}
        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Monthly Payroll
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.monthlyPayrollCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monthly base salary liability</p>
        </Card>

        {/* Card 4: Total Salary Paid YTD */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Total Salary Paid
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalSalaryPaidYTD)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative salary paid</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search employee name, mobile, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Filter by Status */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Staff</option>
              <option value="inactive">Inactive Staff</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Feed Table */}
      <Card>
        <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF7A00]" />
            Employees Directory ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={employees}
            emptyText={isLoading ? 'Loading employee directory...' : 'No employees registered yet.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmpForEdit(null);
        }}
        onSuccess={fetchEmployeeData}
        employeeToEdit={selectedEmpForEdit}
      />

      <PaySalaryModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedEmpIdForPay(undefined);
        }}
        onSuccess={fetchEmployeeData}
        employees={employees.filter((e) => e.status === 'active')}
        selectedEmployeeId={selectedEmpIdForPay}
      />

      <EmployeeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedEmpForHistory(null);
        }}
        employee={selectedEmpForHistory}
      />
    </div>
  );
}

