'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Stamp, Customer } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import { getStamps, deleteStamp, getStampMetrics } from '@/lib/actions/stamps';
import { getCustomers } from '@/lib/actions/customers';
import { StampModal } from '@/components/stamps/stamp-modal';
import { DeleteStampModal } from '@/components/stamps/delete-stamp-modal';
import {
  FileSignature,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Tag,
  User,
  Pencil,
  Trash2,
  Database,
  Hash,
  Award,
} from 'lucide-react';

const STAMP_TYPES = [
  'all',
  'Agreement Stamp',
  'Promissory Note',
  'Legal Affidavit',
  'e-Stamp',
  'Revenue Stamp',
  'Misc',
];

export default function StampsPage() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [customerIdFilter, setCustomerIdFilter] = useState('all');
  const [stampTypeFilter, setStampTypeFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Metrics
  const [todaysStampIncome, setTodaysStampIncome] = useState(0);
  const [thisMonthsStampIncome, setThisMonthsStampIncome] = useState(0);
  const [totalStampIncome, setTotalStampIncome] = useState(0);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stampToDelete, setStampToDelete] = useState<Stamp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  // Load Customers list for filter dropdown
  useEffect(() => {
    getCustomers().then((res) => {
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    });
  }, []);

  const fetchStampData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stampRes, metricsRes] = await Promise.all([
        getStamps(searchQuery, customerIdFilter, stampTypeFilter, startDateFilter, endDateFilter),
        getStampMetrics(),
      ]);

      if (stampRes.success && stampRes.data) {
        setStamps(stampRes.data);
      } else {
        showToast(stampRes.error || 'Failed to fetch stamps', 'error');
      }

      if (metricsRes.success && metricsRes.data) {
        setTodaysStampIncome(metricsRes.data.todaysStampIncome);
        setThisMonthsStampIncome(metricsRes.data.thisMonthsStampIncome);
        setTotalStampIncome(metricsRes.data.totalStampIncome);
      }
    } catch (err: any) {
      showToast('Error querying stamps from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, customerIdFilter, stampTypeFilter, startDateFilter, endDateFilter, showToast]);

  useEffect(() => {
    fetchStampData();
  }, [fetchStampData]);

  const handleDeleteConfirm = async () => {
    if (!stampToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteStamp(stampToDelete.id);
      if (res.success) {
        showToast('Stamp record deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setStampToDelete(null);
        fetchStampData();
      } else {
        showToast(res.error || 'Failed to delete stamp record', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting stamp record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Stamp>[] = [
    {
      accessorKey: 'stampDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.stampDate)}
        </span>
      ),
    },
    {
      accessorKey: 'customerCode',
      header: 'Customer ID',
      cell: ({ row }) => (
        <Badge variant="info" className="font-mono text-xs font-semibold tracking-wide">
          {row.original.customerCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {row.original.customerName}
        </span>
      ),
    },
    {
      accessorKey: 'stampType',
      header: 'Stamp Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-xs border-violet-200 text-violet-700 dark:text-violet-300">
          {row.original.stampType}
        </Badge>
      ),
    },
    {
      accessorKey: 'stampNumber',
      header: 'Stamp Serial/No',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.stampNumber || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[120px] truncate block">
          {row.original.vendor || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Stamp Amount',
      cell: ({ row }) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.amount)}
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
              setSelectedStamp(row.original);
              setIsFormModalOpen(true);
            }}
            className="h-8 px-2 text-[#FF7A00] hover:text-[#FF7A00]"
            title="Edit Stamp"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStampToDelete(row.original);
              setIsDeleteModalOpen(true);
            }}
            className="h-8 px-2 text-rose-600 hover:text-rose-700"
            title="Delete Stamp"
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
              Stamps Module
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track legal agreement stamps, promissory notes, e-stamps, and customer stamp income collected.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStampData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedStamp(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Stamp Income
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Today&apos;s Stamp Income
            </span>
            <Badge variant="success" className="text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(todaysStampIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Stamp income collected today from customers</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              This Month Stamp Income
            </span>
            <Badge variant="success" className="text-[10px]">This Month</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(thisMonthsStampIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Stamp income collected in current month</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Total Stamp Income
            </span>
            <Badge variant="success" className="text-[10px]">All-Time</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(totalStampIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative stamp income collected from customers</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Stamps Registered
            </span>
            <Badge variant="outline" className="text-[10px]">Count</Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : stamps.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total recorded stamp papers</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search serial, vendor, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Filter by Customer */}
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerId} - {c.customerName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Stamp Type */}
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={stampTypeFilter}
              onChange={(e) => setStampTypeFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              {STAMP_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st === 'all' ? 'All Stamp Types' : st}
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

      {/* Stamps Table */}
      <Card>
        <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <CardTitle className="text-sm uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-violet-500" />
            Legal Stamps Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={columns}
            data={stamps}
            emptyText={isLoading ? 'Loading stamp records...' : 'No stamp records found.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Stamp Modal */}
      <StampModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStamp(null);
        }}
        onSuccess={fetchStampData}
        stampToEdit={selectedStamp}
      />

      {/* Delete Stamp Modal */}
      <DeleteStampModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStampToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        stamp={stampToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

