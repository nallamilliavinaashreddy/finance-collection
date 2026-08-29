'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  getDepositors,
  getDepositorMetrics,
  deleteDepositor,
  closeDepositor,
} from '@/lib/actions/depositors';
import { Depositor, DepositorMetrics } from '@/types';
import { AddDepositorModal } from '@/components/depositors/add-depositor-modal';
import { RecordDepositorTransactionModal } from '@/components/depositors/record-depositor-transaction-modal';
import { DepositorHistoryModal } from '@/components/depositors/depositor-history-modal';
import { useToast } from '@/components/providers/toast-provider';
import {
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Database,
  Receipt,
  History,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  DollarSign,
  Percent,
  Calendar,
  Filter,
} from 'lucide-react';

export default function DepositorsPage() {
  const [depositors, setDepositors] = useState<Depositor[]>([]);
  const [metrics, setMetrics] = useState<DepositorMetrics>({
    totalDepositedAmount: 0,
    activeDepositors: 0,
    outstandingDepositBalance: 0,
    monthlyInterestPayable: 0,
    totalInterestPaid: 0,
    closedDeposits: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDepositorForEdit, setSelectedDepositorForEdit] = useState<Depositor | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedDepositorForTx, setSelectedDepositorForTx] = useState<Depositor | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDepositorForHistory, setSelectedDepositorForHistory] = useState<Depositor | null>(null);

  const { showToast } = useToast();

  const fetchDepositorData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depRes, metRes] = await Promise.all([
        getDepositors(searchQuery, statusFilter, reportFilter),
        getDepositorMetrics(),
      ]);

      if (depRes.success && depRes.data) {
        setDepositors(depRes.data);
      } else {
        showToast(depRes.error || 'Failed to fetch depositors', 'error');
      }

      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err: any) {
      showToast('Error fetching depositor data from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, reportFilter, showToast]);

  useEffect(() => {
    fetchDepositorData();
  }, [fetchDepositorData]);

  const handleDeleteConfirm = async (depositor: Depositor) => {
    if (!confirm(`Are you sure you want to delete depositor "${depositor.depositorName}"?`)) return;
    try {
      const res = await deleteDepositor(depositor.id);
      if (res.success) {
        showToast(`Depositor "${depositor.depositorName}" deleted successfully`, 'success');
        fetchDepositorData();
      } else {
        showToast(res.error || 'Failed to delete depositor', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting depositor', 'error');
    }
  };

  const handleCloseDepositor = async (depositor: Depositor) => {
    if (!confirm(`Are you sure you want to close depositor "${depositor.depositorName}"?`)) return;
    try {
      const res = await closeDepositor(depositor.id);
      if (res.success) {
        showToast(`Depositor "${depositor.depositorName}" closed!`, 'success');
        fetchDepositorData();
      } else {
        showToast(res.error || 'Failed to close depositor', 'error');
      }
    } catch (err: any) {
      showToast('Error closing depositor', 'error');
    }
  };

  // DataTable Columns
  const columns: ColumnDef<Depositor>[] = [
    {
      accessorKey: 'depositorName',
      header: 'Depositor Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
            {row.original.depositorName}
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {row.original.mobileNumber ? `📱 ${row.original.mobileNumber}` : row.original.address || 'No phone'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'depositAmount',
      header: 'Initial Deposit',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(row.original.depositAmount)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {row.original.paymentMode} • {formatDate(row.original.depositDate)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'monthlyInterestRate',
      header: 'Interest Rate & Accrual',
      cell: ({ row }) => {
        const accrued = row.original.accruedInterest || 0;
        const days = row.original.elapsedDays || 0;
        return (
          <div className="flex flex-col">
            <Badge variant="warning" className="w-fit font-bold text-xs">
              {row.original.monthlyInterestRate}% / mo
            </Badge>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">
              Accrued: {formatCurrency(accrued)} ({days} {days === 1 ? 'day' : 'days'})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'outstandingPrincipal',
      header: 'Outstanding Principal',
      cell: ({ row }) => (
        <span className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.outstandingPrincipal)}
        </span>
      ),
    },
    {
      accessorKey: 'totalInterestPaid',
      header: 'Total Interest Paid',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.totalInterestPaid)}
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {/* Record Action (Interest Paid / Return / Top-up) */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedDepositorForTx(row.original);
              setIsTxModalOpen(true);
            }}
            disabled={row.original.status === 'closed'}
            className="h-8 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            title="Record Interest Payment / Principal Return"
          >
            <Receipt className="w-3.5 h-3.5 mr-1" />
            Action
          </Button>

          {/* Ledger History Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDepositorForHistory(row.original);
              setIsHistoryModalOpen(true);
            }}
            className="h-8 px-2 text-slate-600 hover:text-[#FF7A00]"
            title="View Individual Depositor Ledger"
          >
            <History className="w-3.5 h-3.5" />
          </Button>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDepositorForEdit(row.original);
              setIsAddModalOpen(true);
            }}
            className="h-8 px-2 text-[#FF7A00] hover:text-[#FF7A00]"
            title="Edit Depositor"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteConfirm(row.original)}
            className="h-8 px-2 text-rose-600 hover:text-rose-700"
            title="Delete Depositor"
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-amber-600" />
              Depositors Module
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track borrowed depositor money, monthly interest payments, principal returns & real-time Investment Khata integration.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDepositorData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            onClick={() => {
              setSelectedDepositorForEdit(null);
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Add New Depositor
          </Button>
        </div>
      </div>

      {/* Executive Dashboard Summary Cards Grid (6 Required KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Deposited Amount */}
        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Total Deposited
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalDepositedAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative initial deposits</p>
        </Card>

        {/* Card 2: Active Depositors */}
        <Card className="p-4 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
          <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
            Active Depositors
          </span>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : `${metrics.activeDepositors} People`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active deposit accounts</p>
        </Card>

        {/* Card 3: Outstanding Deposit Balance */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Outstanding Principal
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.outstandingDepositBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total principal owed</p>
        </Card>

        {/* Card 4: Monthly Interest Payable */}
        <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            Monthly Payable
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.monthlyInterestPayable)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monthly interest due</p>
        </Card>

        {/* Card 5: Total Interest Paid */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Total Interest Paid
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalInterestPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative interest paid</p>
        </Card>

        {/* Card 6: Closed Deposits */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Closed Deposits
          </span>
          <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-2 truncate">
            {isLoading ? '...' : `${metrics.closedDeposits} Settled`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Settled deposit accounts</p>
        </Card>
      </div>

      {/* Filter Bar & Reports Filter */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search depositor name, mobile, address..."
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
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Depositors</option>
              <option value="closed">Closed / Settled</option>
            </select>
          </div>

          {/* Reports Filter */}
          <div className="relative">
            <Landmark className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Report View: All Records</option>
              <option value="active">Report: Active Depositors</option>
              <option value="closed">Report: Closed Depositors</option>
              <option value="outstanding">Report: Outstanding Deposits</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Depositors Feed Table */}
      <Card>
        <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-500" />
            Depositors Directory Feed ({depositors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={depositors}
            emptyText={isLoading ? 'Loading depositors feed...' : 'No depositor records found.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddDepositorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDepositorForEdit(null);
        }}
        onSuccess={fetchDepositorData}
        depositorToEdit={selectedDepositorForEdit}
      />

      <RecordDepositorTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setSelectedDepositorForTx(null);
        }}
        onSuccess={fetchDepositorData}
        depositor={selectedDepositorForTx}
      />

      <DepositorHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedDepositorForHistory(null);
        }}
        depositor={selectedDepositorForHistory}
      />
    </div>
  );
}

