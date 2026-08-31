'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getInterestTransactions, getInterestMetrics } from '@/lib/actions/interest';
import { getCustomers } from '@/lib/actions/customers';
import { InterestTransaction, InterestMetrics, Customer } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import {
  Percent,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function InterestPage() {
  const [transactions, setTransactions] = useState<InterestTransaction[]>([]);
  const [metrics, setMetrics] = useState<InterestMetrics>({
    dailyInterest: 0,
    weeklyInterest: 0,
    monthlyInterest: 0,
    adjustmentInterest: 0,
    totalInterestCollected: 0,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load customer list for dropdown
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await getCustomers();
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      } catch (err) {
        console.error('Error loading customers in interest page:', err);
      }
    }
    loadCustomers();
  }, []);

  const fetchInterestData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txRes, metRes] = await Promise.all([
        getInterestTransactions(
          searchQuery,
          typeFilter,
          dateFilter,
          startDate,
          endDate,
          selectedCustomer
        ),
        getInterestMetrics(dateFilter, startDate, endDate),
      ]);

      if (txRes.success && txRes.data) {
        setTransactions(txRes.data);
      }
      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err: any) {
      showToast('Error fetching Interest collection data from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, dateFilter, startDate, endDate, selectedCustomer, showToast]);

  useEffect(() => {
    fetchInterestData();
  }, [fetchInterestData]);

  // Interest Ledger Table Columns
  const ledgerColumns: ColumnDef<InterestTransaction>[] = [
    {
      accessorKey: 'transactionDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {row.original.customerName || 'Customer'}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            ID: {row.original.customerCode || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'loanId',
      header: 'Loan Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.loanId.substring(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'interestType',
      header: 'Interest Type',
      cell: ({ row }) => {
        const type = row.original.interestType;
        let variant: 'success' | 'info' | 'warning' | 'outline' = 'info';
        let label = 'Daily';

        if (type === 'daily') {
          variant = 'info';
          label = 'Daily Loan';
        } else if (type === 'weekly') {
          variant = 'warning';
          label = 'Weekly Loan';
        } else if (type === 'monthly') {
          variant = 'success';
          label = 'Monthly Loan';
        } else if (type === 'adjustment') {
          variant = 'outline';
          label = 'Adjustment Loan';
        }

        return (
          <Badge variant={variant} className="font-semibold text-xs capitalize">
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'interestAmount',
      header: 'Interest Collected (₹)',
      cell: ({ row }) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
          {formatCurrency(row.original.interestAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'collectionId',
      header: 'Collection Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500">
          {row.original.collectionId ? row.original.collectionId.substring(0, 8) + '...' : 'Direct'}
        </span>
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
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Percent className="w-6 h-6 text-emerald-600" />
              Interest Collections
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated customer loan interest collection ledger & business interest earnings.
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInterestData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 5 Executive Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Daily Interest */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
          <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
            Daily Interest
          </span>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.dailyInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Daily loan interest collected</p>
        </Card>

        {/* Card 2: Weekly Interest */}
        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Weekly Interest
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.weeklyInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Weekly loan interest collected</p>
        </Card>

        {/* Card 3: Monthly Interest */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Monthly Interest
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.monthlyInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monthly loan interest collected</p>
        </Card>

        {/* Card 4: Adjustment Interest */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
          <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
            Adjustment Interest
          </span>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.adjustmentInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Adjustment interest collected</p>
        </Card>

        {/* Card 5: Total Interest Collected */}
        <Card className="p-4 flex flex-col justify-between border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Total Interest Collected
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalInterestCollected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Grand total collected</p>
        </Card>
      </div>

      {/* Filter Controls Card */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <Input
                placeholder="Search by customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Date Quick Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {/* Interest Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Interest Types</option>
              <option value="daily">Daily Interest</option>
              <option value="weekly">Weekly Interest</option>
              <option value="monthly">Monthly Interest</option>
              <option value="adjustment">Adjustment Interest</option>
            </select>

            {/* Customer Filter */}
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="h-9 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium max-w-[200px]"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} ({c.customerId})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Interest Collection Ledger Table */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            Collected Customer Loan Interest Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={ledgerColumns}
            data={transactions}
            emptyText={isLoading ? 'Loading interest collection records...' : 'No interest collections recorded yet.'}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}

