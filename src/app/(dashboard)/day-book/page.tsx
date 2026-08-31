'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { getDayBookData, DayBookData, DayBookTransaction } from '@/lib/actions/day-book';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Wallet,
} from 'lucide-react';

export default function DayBookPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [dayBookData, setDayBookData] = useState<DayBookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const fetchDayBook = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDayBookData(selectedDate);
      if (res.success && res.data) {
        setDayBookData(res.data);
      } else {
        showToast(res.error || 'Failed to fetch Day Book data', 'error');
      }
    } catch (err: any) {
      showToast('Error querying Day Book records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, showToast]);

  useEffect(() => {
    fetchDayBook();
  }, [fetchDayBook]);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const curr = new Date(selectedDate || new Date().toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const columns: ColumnDef<DayBookTransaction>[] = [
    {
      accessorKey: 'transactionDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            {row.original.description}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Type: {row.original.transactionType}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'amountIn',
      header: 'Cash In (+)',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {row.original.amountIn > 0 ? formatCurrency(row.original.amountIn) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amountOut',
      header: 'Cash Out (-)',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {row.original.amountOut > 0 ? formatCurrency(row.original.amountOut) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'runningBalance',
      header: 'Running Balance',
      cell: ({ row }) => (
        <span className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.runningBalance)}
        </span>
      ),
    },
  ];

  const openingBal = dayBookData?.openingBalance ?? 0;
  const cashInTotal = dayBookData?.totalCashIn ?? 0;
  const cashOutTotal = dayBookData?.totalCashOut ?? 0;
  const closingBal = dayBookData?.closingBalance ?? (openingBal + cashInTotal - cashOutTotal);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Day Book
            </h2>
            <Badge variant="info" className="gap-1 text-[10px]">
              <BookOpen className="w-3 h-3 text-amber-500" />
              Daily Cash Register
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time daily cash inflow, outflow, and automated balance continuity register.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] p-1 rounded-xl shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftDate(-1)}
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-[#FF7A00]" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 border-none bg-transparent p-0 text-xs font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 w-32"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftDate(1)}
              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={setToday}
              className="h-9 text-xs px-2.5"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setYesterday}
              className="h-9 text-xs px-2.5"
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDayBook}
              isLoading={isLoading}
              className="h-9 text-xs px-2.5"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Opening Balance */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-slate-50/50 dark:bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Opening Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(openingBal)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Previous day closing carry forward
          </p>
        </Card>

        {/* 2. Total Cash In */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Total Cash In (+)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(cashInTotal)}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Actual cash received on {formatDate(selectedDate)}
          </p>
        </Card>

        {/* 3. Total Cash Out */}
        <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Total Cash Out (-)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(cashOutTotal)}
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
            Actual cash paid on {formatDate(selectedDate)}
          </p>
        </Card>

        {/* 4. Closing Balance */}
        <Card className="p-4 flex flex-col justify-between border-[#FF7A00]/40 bg-gradient-to-br from-[#FF7A00]/10 via-amber-50/50 to-white dark:via-[#111111] dark:to-[#0D0D0D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] uppercase tracking-wider">
              Closing Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(closingBal)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Opening + Cash In - Cash Out
          </p>
        </Card>
      </div>

      {/* Intra-Day Transaction Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Intra-Day Cash Movement Transactions
            <Badge variant="outline" className="font-mono text-xs">
              {dayBookData?.transactions.length || 0} Records
            </Badge>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Date: {formatDate(selectedDate)}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-[#262626] rounded-xl overflow-hidden bg-white dark:bg-[#111111]">
          <DataTable
            columns={columns}
            data={dayBookData?.transactions || []}
            emptyText={
              isLoading
                ? 'Loading Day Book records...'
                : `No cash transactions recorded for ${formatDate(selectedDate)}.`
            }
            pageSize={15}
          />
        </div>
      </div>
    </div>
  );
}
