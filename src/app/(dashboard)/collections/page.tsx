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

  // Portfolio aggregates
  const todayCollections = collections.filter((c) => c.paymentDate === todayStr);
  const totalCollectedToday = todayCollections.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalCollectedAllTime = collections.reduce((acc, c) => acc + c.amountPaid, 0);

  // Table Columns Definition
  const columns: ColumnDef<Collection>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Collection Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.paymentDate)}
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
      accessorKey: 'amountPaid',
      header: 'Amount Collected',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.amountPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalanceAfterPayment',
      header: 'Remaining Balance (Post-Payment)',
      cell: ({ row }) => (
        <span className="font-bold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.remainingBalanceAfterPayment)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">
          {row.original.remarks || 'Daily recovery'}
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
          className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Daily Collections Stream
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Supabase Connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record collection entries for active loans, store historical post-payment balances, with support for multiple collections 7 days a week.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsFormModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-[#FF7A00]/20 shrink-0"
        >
          Record Daily Collection
        </Button>
      </div>

      {/* Metric Aggregate Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Collected Today ({formatDate(todayStr)})
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(totalCollectedToday)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {todayCollections.length} payments received today
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Collections Stream
              </span>
              <span className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-0.5">
                {formatCurrency(totalCollectedAllTime)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Across {collections.length} total entries
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Post-Payment History Tracking
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Immutable Snapshots
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Historical balances preserved
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Collections Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle>Collections History Log</CardTitle>
            <CardDescription>
              Displays historical remaining balance immediately after each payment
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
                className="h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20"
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Customer ID or Name..."
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-colors"
              />
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => fetchCollections(searchQuery, dateFilter)}
              className="px-3"
              title="Refresh from Supabase"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={collections}
            emptyText={
              isLoading
                ? 'Querying Supabase collections table...'
                : searchQuery || dateFilter
                ? 'No collection entries found matching filters.'
                : 'No collections recorded yet. Click "Record Daily Collection" to create one.'
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

