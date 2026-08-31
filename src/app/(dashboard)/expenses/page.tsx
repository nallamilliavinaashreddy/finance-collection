'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import { getExpenses, deleteExpense, getExpenseMetrics } from '@/lib/actions/expenses';
import { ExpenseModal } from '@/components/expenses/expense-modal';
import { DeleteExpenseModal } from '@/components/expenses/delete-expense-modal';
import {
  Wallet,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Tag,
  CreditCard,
  Pencil,
  Trash2,
  TrendingDown,
  Coins,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

const CATEGORIES = ['all', 'Office', 'Travel', 'Salary', 'Utilities', 'Maintenance', 'Marketing', 'Misc'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Summary Metrics
  const [todaysExpenses, setTodaysExpenses] = useState(0);
  const [thisMonthsExpenses, setThisMonthsExpenses] = useState(0);
  const [totalExpensesSum, setTotalExpensesSum] = useState(0);

  // Modal Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchExpenseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [expRes, metricsRes] = await Promise.all([
        getExpenses(searchQuery, categoryFilter, startDateFilter, endDateFilter),
        getExpenseMetrics(),
      ]);

      if (expRes.success && expRes.data) {
        setExpenses(expRes.data);
      } else {
        showToast(expRes.error || 'Failed to fetch expenses', 'error');
      }

      if (metricsRes.success && metricsRes.data) {
        setTodaysExpenses(metricsRes.data.todaysExpenses);
        setThisMonthsExpenses(metricsRes.data.thisMonthsExpenses);
        setTotalExpensesSum(metricsRes.data.totalExpenses);
      }
    } catch (err: any) {
      showToast('Error querying expenses from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, startDateFilter, endDateFilter, showToast]);

  useEffect(() => {
    fetchExpenseData();
  }, [fetchExpenseData]);

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteExpense(expenseToDelete.id);
      if (res.success) {
        showToast('Expense record deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
        fetchExpenseData();
      } else {
        showToast(res.error || 'Failed to delete expense', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'expenseDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.expenseDate)}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold text-xs">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate block">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'paidTo',
      header: 'Paid To',
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">
          {row.original.paidTo || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px]">
          {row.original.paymentMode}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-extrabold text-rose-600 dark:text-rose-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[150px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedExpense(row.original);
              setIsFormModalOpen(true);
            }}
            className="h-8 px-2 text-[#FF7A00] hover:text-[#FF7A00]"
            title="Edit Expense"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExpenseToDelete(row.original);
              setIsDeleteModalOpen(true);
            }}
            className="h-8 px-2 text-rose-600 hover:text-rose-700"
            title="Delete Expense"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Expenses Module
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Wallet className="w-3 h-3 text-emerald-500" />
              Live Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track business operating expenses, vendor payments, and category-wise spending.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExpenseData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Today&apos;s Expenses
            </span>
            <Badge variant="error" className="text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(todaysExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Expenses recorded for today</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              This Month Expenses
            </span>
            <Badge variant="warning" className="text-[10px]">This Month</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(thisMonthsExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Expenses in current calendar month</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
              Total Expenses
            </span>
            <Badge variant="info" className="text-[10px]">All-Time</Badge>
          </div>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(totalExpensesSum)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative expense total</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Expense Entries
            </span>
            <Badge variant="outline" className="text-[10px]">Count</Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : expenses.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total recorded vouchers</p>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search description, paid to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="pl-9 h-10 text-xs"
              placeholder="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="pl-9 h-10 text-xs"
              placeholder="End Date"
            />
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#FF7A00]" />
            Expense Vouchers Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={expenses}
            emptyText={isLoading ? 'Loading expenses...' : 'No expenses found.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={fetchExpenseData}
        expenseToEdit={selectedExpense}
      />

      {/* Delete Expense Modal */}
      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        expense={expenseToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

