'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Chit } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import { getChits, deleteChit, getChitMetrics } from '@/lib/actions/chits';
import { ChitModal } from '@/components/chits/chit-modal';
import { ChitPaymentModal } from '@/components/chits/chit-payment-modal';
import { ChitHistoryModal } from '@/components/chits/chit-history-modal';
import { DeleteChitModal } from '@/components/chits/delete-chit-modal';
import { ChitPrizeModal } from '@/components/chits/chit-prize-modal';
import {
  Coins,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Building2,
  Hash,
  Pencil,
  Trash2,
  Database,
  DollarSign,
  Receipt,
  History,
  CheckCircle2,
  Clock,
  Trophy,
} from 'lucide-react';

export default function ChitsPage() {
  const [chits, setChits] = useState<Chit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Metrics
  const [todaysChitPayments, setTodaysChitPayments] = useState(0);
  const [thisMonthsChitPayments, setThisMonthsChitPayments] = useState(0);
  const [totalChitValue, setTotalChitValue] = useState(0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [totalPrizeReceived, setTotalPrizeReceived] = useState(0);

  // Modals
  const [isChitModalOpen, setIsChitModalOpen] = useState(false);
  const [selectedChit, setSelectedChit] = useState<Chit | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentChit, setPaymentChit] = useState<Chit | null>(null);

  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [prizeChit, setPrizeChit] = useState<Chit | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyChit, setHistoryChit] = useState<Chit | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chitToDelete, setChitToDelete] = useState<Chit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchChitData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [chitsRes, metricsRes] = await Promise.all([
        getChits(searchQuery, statusFilter, startDateFilter, endDateFilter),
        getChitMetrics(),
      ]);

      if (chitsRes.success && chitsRes.data) {
        setChits(chitsRes.data);
      } else {
        showToast(chitsRes.error || 'Failed to fetch chit subscriptions', 'error');
      }

      if (metricsRes.success && metricsRes.data) {
        setTodaysChitPayments(metricsRes.data.todaysChitPayments);
        setThisMonthsChitPayments(metricsRes.data.thisMonthsChitPayments);
        setTotalChitValue(metricsRes.data.totalChitValue);
        setTotalPaidAmount(metricsRes.data.totalPaidAmount);
        setTotalPrizeReceived(metricsRes.data.totalPrizeReceived);
      }
    } catch (err: any) {
      showToast('Error querying chits from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, startDateFilter, endDateFilter, showToast]);

  useEffect(() => {
    fetchChitData();
  }, [fetchChitData]);

  const handleDeleteConfirm = async () => {
    if (!chitToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteChit(chitToDelete.id);
      if (res.success) {
        showToast('Chit subscription deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setChitToDelete(null);
        fetchChitData();
      } else {
        showToast(res.error || 'Failed to delete chit subscription', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting chit subscription', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Chit>[] = [
    {
      accessorKey: 'chitCompany',
      header: 'Chit Company',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            {row.original.chitCompany}
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Group: {row.original.groupNumber}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'chitValue',
      header: 'Chit Value',
      cell: ({ row }) => (
        <span className="font-extrabold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.original.chitValue)}
        </span>
      ),
    },
    {
      accessorKey: 'paidMonths',
      header: 'Installments (Paid / Remaining)',
      cell: ({ row }) => {
        const pct = Math.min(100, Math.round((row.original.paidMonths / row.original.totalMonths) * 100));
        return (
          <div className="flex flex-col gap-1 w-36">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-slate-800 dark:text-slate-200">
                {row.original.paidMonths} / {row.original.totalMonths} mos
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {row.original.remainingInstallments} left
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalPaid',
      header: 'Total Paid',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.totalPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'prizeTaken',
      header: 'Prize Taken',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          {row.original.prizeTaken ? (
            <Badge variant="success" className="w-fit text-[10px] gap-1">
              <Trophy className="w-3 h-3" />
              Yes ({formatCurrency(row.original.prizeAmount)})
            </Badge>
          ) : (
            <Badge variant="outline" className="w-fit text-[10px] text-slate-500">
              No
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'active'
              ? 'success'
              : row.original.status === 'completed'
              ? 'info'
              : 'outline'
          }
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
          {/* Record Monthly Payment Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPaymentChit(row.original);
              setIsPaymentModalOpen(true);
            }}
            disabled={row.original.status === 'completed' || row.original.status === 'closed'}
            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Record Monthly Payment"
          >
            <Receipt className="w-3.5 h-3.5 mr-1" />
            Pay
          </Button>

          {/* Record Prize Received Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPrizeChit(row.original);
              setIsPrizeModalOpen(true);
            }}
            className="h-8 px-2 text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            title="Record / Edit Chit Prize Received"
          >
            <Trophy className="w-3.5 h-3.5 mr-1" />
            Prize
          </Button>

          {/* Payment History Ledger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHistoryChit(row.original);
              setIsHistoryModalOpen(true);
            }}
            className="h-8 px-2 text-[#A3A3A3] hover:text-[#FF7A00]"
            title="View Payment History Ledger"
          >
            <History className="w-3.5 h-3.5" />
          </Button>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedChit(row.original);
              setIsChitModalOpen(true);
            }}
            className="h-8 px-2 text-[#FF7A00] hover:text-[#FF9500]"
            title="Edit Chit Subscription"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setChitToDelete(row.original);
              setIsDeleteModalOpen(true);
            }}
            className="h-8 px-2 text-rose-600 hover:text-rose-700"
            title="Delete Chit Subscription"
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
              Chits Module
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fully customizable chit fund subscriptions (any duration, flexible payments), installment counters, and Investment Khata integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChitData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedChit(null);
              setIsChitModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Chit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Today&apos;s Chit Payments
            </span>
            <Badge variant="success" className="text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(todaysChitPayments)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chit installments paid today</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              This Month Chit Payments
            </span>
            <Badge variant="warning" className="text-[10px]">This Month</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(thisMonthsChitPayments)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chit installments paid in current month</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-[#262626] bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] uppercase tracking-wider">
              Total Chit Pool Value
            </span>
            <Badge variant="info" className="text-[10px]">Pool Total</Badge>
          </div>
          <div className="text-2xl font-bold text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(totalChitValue)}
          </div>
          <p className="text-[11px] text-[#A3A3A3] mt-1">Cumulative subscription pool value</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-[#262626] bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
              Total Amount Paid
            </span>
            <Badge variant="outline" className="text-[10px]">All-Time Paid</Badge>
          </div>
          <div className="text-2xl font-bold text-white mt-2 truncate">
            {isLoading ? '...' : formatCurrency(totalPaidAmount)}
          </div>
          <p className="text-[11px] text-[#A3A3A3] mt-1">Total installments paid to date</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-amber-900/60 bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Prize Received Total
            </span>
            <Badge variant="warning" className="text-[10px] gap-1">
              <Trophy className="w-3 h-3" />
              Prize Total
            </Badge>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(totalPrizeReceived)}
          </div>
          <p className="text-[11px] text-[#A3A3A3] mt-1">Total prize money received into business</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#737373]" />
            <Input
              placeholder="Search company, group, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Filter by Status */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-[#737373]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#262626] bg-[#141414] text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed / Cancelled</option>
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

      {/* Chits Table */}
      <Card>
        <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            Chit Subscriptions Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={chits}
            emptyText={isLoading ? 'Loading chit subscriptions...' : 'No chit subscriptions found.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Chit Modal */}
      <ChitModal
        isOpen={isChitModalOpen}
        onClose={() => {
          setIsChitModalOpen(false);
          setSelectedChit(null);
        }}
        onSuccess={fetchChitData}
        chitToEdit={selectedChit}
      />

      {/* Record Monthly Payment Modal */}
      <ChitPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentChit(null);
        }}
        onSuccess={fetchChitData}
        chit={paymentChit}
      />

      {/* Record Prize Received Modal */}
      <ChitPrizeModal
        isOpen={isPrizeModalOpen}
        onClose={() => {
          setIsPrizeModalOpen(false);
          setPrizeChit(null);
        }}
        onSuccess={fetchChitData}
        chit={prizeChit}
      />

      {/* Payment History Ledger Modal */}
      <ChitHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryChit(null);
        }}
        chit={historyChit}
      />

      {/* Delete Chit Modal */}
      <DeleteChitModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setChitToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        chit={chitToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
