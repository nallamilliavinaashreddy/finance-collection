'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, flexRender } from '@tanstack/react-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Loan, Collection, AdjustmentLedgerItem } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import { useLanguage } from '@/i18n/language-context';
import { getDashboardData, CategorizedDashboardData } from '@/lib/actions/dashboard';
import {
  Users,
  Landmark,
  Receipt,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  Clock,
  Database,
  CheckCircle2,
  PiggyBank,
  Target,
  MapPin,
  CalendarDays,
  CalendarRange,
  SlidersHorizontal,
  Coins,
  DollarSign,
  Briefcase,
  Percent,
  Wallet,
  FileSignature,
} from 'lucide-react';

import { AnimatedNumber } from '@/components/ui/animated-number';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<CategorizedDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDashboardData();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showToast(res.error || 'Failed to query dashboard metrics', 'error');
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase database for dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Standard Collection Columns
  const collectionColumns: ColumnDef<Collection>[] = [
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
      header: 'Post-Payment Balance',
      cell: ({ row }) => (
        <span className="font-bold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.remainingBalanceAfterPayment)}
        </span>
      ),
    },
  ];

  // Standard Loan Columns
  const loanColumns: ColumnDef<Loan>[] = [
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
        <div className="flex flex-col leading-none">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.original.customerName}
          </span>
          {row.original.city && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {row.original.city}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amountGiven',
      header: 'Amount Given',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.original.amountGiven)}
        </span>
      ),
    },
    {
      accessorKey: 'totalCollectionAmount',
      header: 'Total Target',
      cell: ({ row }) => (
        <span className="font-bold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.totalCollectionAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Remaining Balance',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {formatCurrency(row.original.balanceAmount)}
        </span>
      ),
    },
  ];

  // Adjustment Ledger Feed Columns
  const adjustmentLedgerColumns: ColumnDef<AdjustmentLedgerItem>[] = [
    {
      accessorKey: 'transactionDate',
      header: 'Transaction Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.transactionType === 'interest'
              ? 'error'
              : row.original.transactionType === 'payment'
              ? 'success'
              : 'info'
          }
          className="capitalize text-[10px]"
        >
          {row.original.transactionType}
        </Badge>
      ),
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Bal',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatCurrency(row.original.openingBalance)}</span>
      ),
    },
    {
      accessorKey: 'interestAdded',
      header: 'Daily Interest Added',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-rose-600 font-semibold">
          {row.original.interestAdded > 0 ? `+${formatCurrency(row.original.interestAdded)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentReceived',
      header: 'Payment Received',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-emerald-600 font-semibold">
          {row.original.paymentReceived > 0 ? `-${formatCurrency(row.original.paymentReceived)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'closingBalance',
      header: 'Closing Bal',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#FF7A00] font-bold">
          {formatCurrency(row.original.closingBalance)}
        </span>
      ),
    },
  ];

  const overall = data?.overallSummary;
  const daily = data?.dailySection;
  const weekly = data?.weeklySection;
  const monthly = data?.monthlySection;
  const adj = data?.adjustmentSection;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.title', 'Executive Dashboard')}
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live Supabase Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">
            {t('dashboard.description', 'Portfolio summary, active investments, expenses, stamp costs & chit payments followed by 4 isolated loan sections.')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          isLoading={isLoading}
          leftIcon={<RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-500", isLoading && "animate-spin")} />}
        >
          {t('nav.refreshFeed', 'Refresh Feed')}
        </Button>
      </div>

      {/* ================================================================ */}
      {/* PROFIT & LOSS STATEMENT SECTION (5 MANDATORY CARDS) */}
      {/* ================================================================ */}
      <Card className="p-5 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              {t('dashboard.profitLossStatement', 'Profit & Loss Statement')}
            </h3>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-slate-300 dark:border-[#262626] text-slate-600 dark:text-[#A3A3A3]">
            {t('dashboard.netProfitFormula', 'Net Profit = Loan Interest - Investment Interest - Expenses')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Total Investment */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#262626] flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] uppercase tracking-wider">
              {t('dashboard.totalInvestment', 'Total Investment')}
            </span>
            <div className="text-2xl font-extrabold text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.totalInvestment ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-[#A3A3A3] mt-1">{t('dashboard.investmentKhataBalance', 'Investment Khata balance')}</p>
          </div>

          {/* Card 2: Loan Interest */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/60 flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Loan Interest
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2 truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.loanInterest ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-[#A3A3A3] mt-1">Earned from active loans</p>
          </div>

          {/* Card 3: Investment Interest */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/60 flex flex-col justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Investment Interest
            </span>
            <div className="text-2xl font-extrabold text-amber-400 mt-2 truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.investmentInterest ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-[#A3A3A3] mt-1">Owner capital interest cost</p>
          </div>

          {/* Card 4: Expenses */}
          <div className="p-3.5 rounded-xl bg-[#111111] border border-[#262626] flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
              Expenses
            </span>
            <div className="text-2xl font-extrabold text-white mt-2 truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.totalExpenses ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-[#A3A3A3] mt-1">Operating expenses</p>
          </div>

          {/* Card 5: Net Profit / Loss */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              (data?.profitLoss?.netProfit ?? 0) >= 0
                ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
                : 'bg-rose-950/20 border-rose-900/60 text-rose-400'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">
              Net Profit / Loss
            </span>
            <div
              className={`text-2xl font-black mt-2 truncate ${
                (data?.profitLoss?.netProfit ?? 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.netProfit ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {(data?.profitLoss?.netProfit ?? 0) >= 0 ? 'Net Profit' : 'Net Loss'}
            </p>
          </div>
        </div>
      </Card>

      {/* ================================================================ */}
      {/* OVERALL SUMMARY SECTION (TOP WITH ALL SUMMARY CARDS) */}
      {/* ================================================================ */}
      <Card className="p-5 bg-[#111111] border border-[#262626] text-white flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
            <h3 className="text-base font-bold text-white tracking-wide uppercase">
              Overall Portfolio, Expenses, Stamps & Chits Summary
            </h3>
          </div>
          <Badge variant="info" className="text-[11px] py-0.5">
            Aggregated Live Data
          </Badge>
        </div>

        {/* Core Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">
              Total Customers
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {isLoading ? '...' : overall?.totalCustomers ?? 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">
              Active Loans
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {isLoading ? '...' : overall?.activeLoansCount ?? 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#FF7A00] uppercase tracking-wider">
              Active Investment
            </span>
            <div className="text-lg font-bold text-[#FF7A00] mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.activeInvestment ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#FF7A00] uppercase tracking-wider">
              Portfolio Interest
            </span>
            <div className="text-lg font-bold text-[#FF7A00] mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.totalInterest ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Remaining Balance
            </span>
            <div className="text-lg font-bold text-rose-400 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.remainingBalance ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-900/60 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              Today&apos;s Collections
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.todaysCollections ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/60 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
              Today&apos;s Expenses
            </span>
            <div className="text-lg font-bold text-rose-400 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.todaysExpenses ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-800/60 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
              Today&apos;s Stamp Cost
            </span>
            <div className="text-lg font-bold text-violet-300 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.todaysStampCost ?? 0)}
            </div>
          </div>

          {/* CHIT CARDS 1 & 2 */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                Today&apos;s Chit Pay
              </span>
              <Badge variant="success" className="text-[9px] py-0 px-1">Today</Badge>
            </div>
            <div className="text-lg font-bold text-amber-400 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.todaysChitPayments ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-950/60 to-slate-900 border border-yellow-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-yellow-300 uppercase tracking-wider">
                This Month Chit Pay
              </span>
              <Badge variant="warning" className="text-[9px] py-0 px-1">Month</Badge>
            </div>
            <div className="text-lg font-bold text-yellow-300 mt-1 truncate">
              {isLoading ? '...' : formatCurrency(overall?.thisMonthsChitPayments ?? 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================ */}
      {/* SECTION 1: DAILY LOANS */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <CalendarDays className="w-5 h-5 text-[#FF7A00]" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            1. Daily Loans Section
          </h3>
          <Badge variant="info" className="ml-auto text-[10px]">
            Strictly Daily Loans
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Investment (Active Daily Loans)
              </span>
              <Badge variant="info" className="text-[10px] py-0 font-mono">
                {daily?.activeLoansCount ?? 0} Active Loans
              </Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(daily?.investment ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SUM(amount_given) WHERE is_closed = false</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Daily Interest
              </span>
              <Badge variant="default" className="text-[10px] py-0">Target - Given</Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(daily?.interest ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total Collection Target - Total Amount Given</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Recent Daily Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={collectionColumns}
                data={daily?.recentCollections || []}
                emptyText={isLoading ? 'Loading daily collections...' : 'No daily collections recorded yet.'}
                pageSize={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Active Daily Loans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={loanColumns}
                data={daily?.activeLoans || []}
                emptyText={isLoading ? 'Loading active daily loans...' : 'No active daily loans.'}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: WEEKLY LOANS */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Clock className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            2. Weekly Loans Section
          </h3>
          <Badge variant="success" className="ml-auto text-[10px]">
            Strictly Weekly Loans
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Investment (Active Weekly Loans)
              </span>
              <Badge variant="info" className="text-[10px] py-0 font-mono">
                {weekly?.activeLoansCount ?? 0} Active Loans
              </Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(weekly?.investment ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SUM(amount_given) WHERE is_closed = false</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Weekly Interest
              </span>
              <Badge variant="default" className="text-[10px] py-0">Target - Given</Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(weekly?.interest ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total Collection Target - Total Amount Given</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Recent Weekly Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={collectionColumns}
                data={weekly?.recentCollections || []}
                emptyText={isLoading ? 'Loading weekly collections...' : 'No weekly collections recorded yet.'}
                pageSize={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Active Weekly Loans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={loanColumns}
                data={weekly?.activeLoans || []}
                emptyText={isLoading ? 'Loading active weekly loans...' : 'No active weekly loans.'}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 3: MONTHLY LOANS */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <CalendarRange className="w-5 h-5 text-[#FF7A00]" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            3. Monthly Loans Section
          </h3>
          <Badge variant="default" className="ml-auto text-[10px]">
            Strictly Monthly Loans
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Investment (Active Monthly Loans)
              </span>
              <Badge variant="info" className="text-[10px] py-0 font-mono">
                {monthly?.activeLoansCount ?? 0} Active Loans
              </Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(monthly?.investment ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SUM(amount_given) WHERE is_closed = false</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Monthly Interest
              </span>
              <Badge variant="default" className="text-[10px] py-0">Target - Given</Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(monthly?.interest ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total Collection Target - Total Amount Given</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Recent Monthly Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={collectionColumns}
                data={monthly?.recentCollections || []}
                emptyText={isLoading ? 'Loading monthly collections...' : 'No monthly collections recorded yet.'}
                pageSize={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Active Monthly Loans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={loanColumns}
                data={monthly?.activeLoans || []}
                emptyText={isLoading ? 'Loading active monthly loans...' : 'No active monthly loans.'}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 4: ADJUSTMENT LOANS */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <SlidersHorizontal className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            4. Adjustment Loans Section (Simple Daily Interest)
          </h3>
          <Badge variant="outline" className="ml-auto text-[10px] border-violet-200 text-violet-700">
            Strictly Adjustment Loans
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Investment (Active Adjustment Loans)
              </span>
              <Badge variant="info" className="text-[10px] py-0 font-mono">
                {adj?.activeLoansCount ?? 0} Active Loans
              </Badge>
            </div>
            <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
              {isLoading ? '...' : formatCurrency(adj?.investment ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SUM(amount_given) WHERE is_closed = false</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <Badge variant="error" className="text-[10px] py-0">Current Balance</Badge>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
              {isLoading ? '...' : formatCurrency(adj?.outstandingBalance ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Current balance on active Adjustment loans</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Adjustment Ledger Transactions Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={adjustmentLedgerColumns}
                data={adj?.recentLedgerTransactions || []}
                emptyText={isLoading ? 'Loading adjustment ledger...' : 'No adjustment ledger entries recorded yet.'}
                pageSize={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Active Adjustment Loans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={loanColumns}
                data={adj?.activeLoans || []}
                emptyText={isLoading ? 'Loading active adjustment loans...' : 'No active adjustment loans.'}
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

