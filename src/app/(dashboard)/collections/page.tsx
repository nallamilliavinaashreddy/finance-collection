'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Collection } from '@/types';
import { CollectionFormData } from '@/lib/validations/collection';
import { getCollections, createCollection, deleteCollection } from '@/lib/actions/collections';
import { CollectionModal } from '@/components/collections/collection-modal';
import { DeleteCollectionModal } from '@/components/collections/delete-collection-modal';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Calendar,
  IndianRupee,
  Database,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch Collections list from Supabase
  const fetchCollections = useCallback(async (query: string = '', date: string = '') => {
    setIsLoading(true);
    try {
      const res = await getCollections(query, date);
      if (res.success && res.data) {
        setCollections(res.data);
      } else {
        showToast(res.error || 'Failed to query collections table in Supabase', 'error');
        setCollections([]);
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase collections table', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCollections(searchQuery, dateFilter);
  }, [searchQuery, dateFilter, fetchCollections]);

  // Handle Record Collection Form Submit to Supabase
  const handleFormSubmit = async (formData: CollectionFormData) => {
    setIsSubmitting(true);
    try {
      const res = await createCollection(formData);
      if (res.success && res.data) {
        showToast(
          `Collection of ${formatCurrency(res.data.amountPaid)} recorded. Remaining Balance: ${formatCurrency(res.data.remainingBalanceAfterPayment)}.`,
          'success',
          'Collection Recorded'
        );
        setIsFormModalOpen(false);
        fetchCollections(searchQuery, dateFilter);
      } else {
        showToast(res.error || 'Failed to record collection in Supabase', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during Supabase collection creation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete Collection in Supabase
  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCollection(collectionToDelete.id);
      if (res.success) {
        showToast(`Collection entry deleted and loan balance reverted.`, 'success', 'Collection Deleted');
        setIsDeleteModalOpen(false);
        setCollectionToDelete(null);
        fetchCollections(searchQuery, dateFilter);
      } else {
        showToast(res.error || 'Failed to delete collection from Supabase', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during collection deletion.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'adjustment'>('all');

  // Portfolio aggregates by Collection Type
  const todayCollections = collections.filter((c) => c.paymentDate === todayStr);
  const totalCollectedToday = todayCollections.reduce((acc, c) => acc + c.amountPaid, 0);

  const dailyTotal = collections.filter((c) => (c.loanType || 'daily') === 'daily').reduce((acc, c) => acc + c.amountPaid, 0);
  const weeklyTotal = collections.filter((c) => c.loanType === 'weekly').reduce((acc, c) => acc + c.amountPaid, 0);
  const monthlyTotal = collections.filter((c) => c.loanType === 'monthly').reduce((acc, c) => acc + c.amountPaid, 0);
  const adjustmentTotal = collections.filter((c) => c.loanType === 'adjustment').reduce((acc, c) => acc + c.amountPaid, 0);

  const filteredCollections = collections.filter((c) => {
    if (activeTab === 'all') return true;
    return (c.loanType || 'daily') === activeTab;
  });

  // Table Columns Definition
  const columns: ColumnDef<Collection>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Collection Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">
          {formatDate(row.original.paymentDate)}
        </span>
      ),
    },
    {
      accessorKey: 'loanType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.loanType || 'daily';
        const badgeVariants: Record<string, 'daily' | 'weekly' | 'monthly' | 'adjustment'> = {
          daily: 'daily',
          weekly: 'weekly',
          monthly: 'monthly',
          adjustment: 'adjustment',
        };
        return (
          <Badge variant={badgeVariants[type] || 'daily'} className="uppercase text-[10px] font-bold">
            [{type}]
          </Badge>
        );
      },
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
        <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
          {row.original.customerName}
        </span>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: 'Amount Collected',
      cell: ({ row }) => (
        <span className="font-bold text-[#22C55E]">
          {formatCurrency(row.original.amountPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalanceAfterPayment',
      header: 'Remaining Balance (Post-Payment)',
      cell: ({ row }) => (
        <span className="font-bold text-[#F59E0B]">
          {formatCurrency(row.original.remainingBalanceAfterPayment)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-[200px] truncate block">
          {row.original.remarks || 'Collection recovery'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCollectionToDelete(row.original);
            setIsDeleteModalOpen(true);
          }}
          className="h-8 w-8 p-0 text-slate-600 hover:text-[#EF4444] dark:text-[#94A3B8] dark:hover:text-[#EF4444]"
          title="Delete Collection"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Collections Stream
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-[#22C55E]" />
              Supabase Connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            Record and view collections clearly separated by type (Daily, Weekly, Monthly, Adjustment).
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsFormModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Record Collection
        </Button>
      </div>

      {/* Metric Aggregate Summary Cards - Separated by Collection Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={activeTab === 'daily' ? 'ring-2 ring-[#F97316]' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Daily Collections
              </span>
              <span className="text-xl font-bold text-[#F97316] mt-0.5">
                {formatCurrency(dailyTotal)}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5">
                {collections.filter(c => (c.loanType || 'daily') === 'daily').length} payments
              </span>
            </div>
            <Badge variant="daily" className="uppercase text-[10px]">Daily</Badge>
          </CardContent>
        </Card>

        <Card className={activeTab === 'weekly' ? 'ring-2 ring-[#8B5CF6]' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Weekly Collections
              </span>
              <span className="text-xl font-bold text-[#8B5CF6] mt-0.5">
                {formatCurrency(weeklyTotal)}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5">
                {collections.filter(c => c.loanType === 'weekly').length} payments
              </span>
            </div>
            <Badge variant="weekly" className="uppercase text-[10px]">Weekly</Badge>
          </CardContent>
        </Card>

        <Card className={activeTab === 'monthly' ? 'ring-2 ring-[#3B82F6]' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Monthly Collections
              </span>
              <span className="text-xl font-bold text-[#3B82F6] mt-0.5">
                {formatCurrency(monthlyTotal)}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5">
                {collections.filter(c => c.loanType === 'monthly').length} payments
              </span>
            </div>
            <Badge variant="monthly" className="uppercase text-[10px]">Monthly</Badge>
          </CardContent>
        </Card>

        <Card className={activeTab === 'adjustment' ? 'ring-2 ring-[#14B8A6]' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Adjustment Collections
              </span>
              <span className="text-xl font-bold text-[#14B8A6] mt-0.5">
                {formatCurrency(adjustmentTotal)}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5">
                {collections.filter(c => c.loanType === 'adjustment').length} payments
              </span>
            </div>
            <Badge variant="adjustment" className="uppercase text-[10px]">Adjustment</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Collections Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-[#26344D]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Collections History Log</CardTitle>
              <CardDescription>
                Separated by Daily, Weekly, Monthly, and Adjustment collection types
              </CardDescription>
            </div>

            {/* Search & Date Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter Input */}
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-[#26344D] bg-white dark:bg-[#1B2638] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]"
                />
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Customer ID or Name..."
                  className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-300 dark:border-[#26344D] bg-white dark:bg-[#1B2638] text-slate-900 dark:text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6] transition-colors"
                />
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => fetchCollections(searchQuery, dateFilter)}
                className="px-3"
                title="Refresh from Supabase"
              >
                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
              </Button>
            </div>
          </div>

          {/* Collection Type Separation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[#26344D]/50 pt-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#4F8CFF] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#26344D]'
              }`}
            >
              All ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-[#F97316] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#F97316] border border-[#26344D]'
              }`}
            >
              Daily ({collections.filter(c => (c.loanType || 'daily') === 'daily').length})
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'weekly'
                  ? 'bg-[#8B5CF6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#8B5CF6] border border-[#26344D]'
              }`}
            >
              Weekly ({collections.filter(c => c.loanType === 'weekly').length})
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-[#3B82F6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#3B82F6] border border-[#26344D]'
              }`}
            >
              Monthly ({collections.filter(c => c.loanType === 'monthly').length})
            </button>
            <button
              onClick={() => setActiveTab('adjustment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'adjustment'
                  ? 'bg-[#14B8A6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#14B8A6] border border-[#26344D]'
              }`}
            >
              Adjustment ({collections.filter(c => c.loanType === 'adjustment').length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={filteredCollections}
            emptyText={
              isLoading
                ? 'Querying Supabase collections table...'
                : searchQuery || dateFilter || activeTab !== 'all'
                ? `No ${activeTab !== 'all' ? activeTab : ''} collection entries found matching filters.`
                : 'No collections recorded yet. Click "Record Collection" to create one.'
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Record Collection Modal */}
      <CollectionModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCollectionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCollectionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        collection={collectionToDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}

