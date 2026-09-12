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
  Scale,
  BarChart3,
} from 'lucide-react';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { MonthlyInsightsChart } from '@/components/dashboard/monthly-insights-chart';
import { QuickActionsBar } from '@/components/dashboard/quick-actions-bar';
import { SmartInsightsCard } from '@/components/dashboard/smart-insights-card';
import { RecentActivityTimeline } from '@/components/dashboard/recent-activity-timeline';
import { BentoGrid } from '@/components/dashboard/bento-grid';
import { CollectionPerformanceChart } from '@/components/dashboard/collection-performance-chart';

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
      {/* PREMIUM HERO PANEL */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-white/95 to-indigo-500/10 dark:from-[#F97316]/20 dark:via-[#0F172A]/95 dark:to-[#0B0F17] backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Subtle Background Glow Orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#F97316]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, Administrator! 👋
            </h2>
            <Badge variant="success" className="gap-1.5 text-xs py-1 px-3 shadow-md font-mono">
              <Database className="w-4 h-4 text-emerald-400" />
              Live PostgreSQL Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
            {t('dashboard.description', "Here is your complete financial operating overview for today.")}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={cn("w-4 h-4 transition-transform duration-500", isLoading && "animate-spin")} />}
              className="h-10 px-5 rounded-2xl border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md shadow-sm hover:border-[#F97316]/50 text-slate-900 dark:text-white font-bold"
            >
              {t('nav.refreshFeed', 'Refresh Live Stream')}
            </Button>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Real-Time Sync Active
            </span>
          </div>
        </div>

        {/* Right Side Floating Portfolio Analytics Graphic Card */}
        <div className="relative z-10 shrink-0">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F97316] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-[#F97316]/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Profit Status</span>
              <span className="text-lg font-black font-mono text-emerald-500">
                {isLoading ? '...' : formatCurrency(data?.profitLoss?.netProfit ?? 0)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">Capital Efficiency High</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PROFIT & LOSS STATEMENT SECTION (5 MANDATORY CARDS) */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              {t('dashboard.profitLossStatement', 'Profit & Loss Statement')}
            </h3>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md">
            {t('dashboard.netProfitFormula', 'Net Profit = Loan Interest - Investment Interest - Expenses')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Investment */}
          <Card className="p-5 rounded-3xl border-[#F97316]/30 bg-gradient-to-br from-[#F97316]/10 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 glass-card shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#F97316] uppercase tracking-wider">
                {t('dashboard.totalInvestment', 'Total Investment')}
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#F97316]/15 flex items-center justify-center text-[#F97316]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#F97316] mt-3 font-mono truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.totalInvestment ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">{t('dashboard.investmentKhataBalance', 'Investment Khata balance')}</p>
          </Card>

          {/* Card 2: Loan Interest */}
          <Card className="p-5 rounded-3xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 glass-card shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Loan Interest
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-3 font-mono truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.loanInterest ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-1 font-semibold">Earned from active loans</p>
          </Card>

          {/* Card 3: Investment Interest */}
          <Card className="p-5 rounded-3xl border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 glass-card shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Investment Interest
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-3 font-mono truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.investmentInterest ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400 mt-1 font-semibold">Owner capital interest cost</p>
          </Card>

          {/* Card 4: Expenses */}
          <Card className="p-5 rounded-3xl border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 glass-card shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Expenses
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-3 font-mono truncate">
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.totalExpenses ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">Operating expenses</p>
          </Card>

          {/* Card 5: Net Profit / Loss */}
          <Card
            className={`p-5 rounded-3xl glass-card shadow-xl hover:-translate-y-1 transition-all duration-300 ${
              (data?.profitLoss?.netProfit ?? 0) >= 0
                ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95'
                : 'border-rose-500/40 bg-gradient-to-br from-rose-500/20 via-white/90 to-white dark:via-[#0F172A]/90 dark:to-[#0F172A]/95'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Net Profit / Loss
              </span>
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  (data?.profitLoss?.netProfit ?? 0) >= 0
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/20 text-rose-500'
                }`}
              >
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`text-2xl font-black mt-3 font-mono truncate ${
                (data?.profitLoss?.netProfit ?? 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isLoading ? '...' : <AnimatedNumber value={data?.profitLoss?.netProfit ?? 0} formatAsCurrency />}
            </div>
            <p className="text-[11px] font-extrabold opacity-90 mt-1 uppercase">
              {(data?.profitLoss?.netProfit ?? 0) >= 0 ? 'NET PROFIT' : 'NET LOSS'}
            </p>
          </Card>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <QuickActionsBar />

      {/* ================================================================ */}
      {/* BENTO GRID PORTFOLIO OVERVIEW (10 MODULAR BENTO CARDS) */}
      {/* ================================================================ */}
      <BentoGrid overall={overall} isLoading={isLoading} />

      {/* ================================================================ */}
      {/* CHARTS GRID: CASH FLOW & COLLECTION PERFORMANCE */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart
          collections={daily?.recentCollections}
          todaysExpenses={overall?.todaysExpenses}
          thisMonthsExpenses={overall?.thisMonthsExpenses}
        />
        <CollectionPerformanceChart collections={daily?.recentCollections} />
      </div>

      {/* ================================================================ */}
      {/* PORTFOLIO ALLOCATION & SMART AI INSIGHTS */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MonthlyInsightsChart
            todaysCollections={overall?.todaysCollections}
            thisMonthsExpenses={overall?.thisMonthsExpenses}
            loanInterest={data?.profitLoss?.loanInterest}
            todaysStampCost={overall?.todaysStampCost}
            thisMonthsChitPayments={overall?.thisMonthsChitPayments}
          />
        </div>
        <div className="lg:col-span-2">
          <SmartInsightsCard
            todaysCollections={overall?.todaysCollections}
            todaysExpenses={overall?.todaysExpenses}
            activeLoansCount={overall?.activeLoansCount}
            remainingBalance={overall?.remainingBalance}
            netProfit={data?.profitLoss?.netProfit}
          />
        </div>
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <RecentActivityTimeline
        collections={daily?.recentCollections}
        activeLoans={daily?.activeLoans}
      />

      {/* ================================================================ */}
      {/* SECTION 1: DAILY LOANS */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-5 p-6 rounded-2xl glass-panel shadow-xl">
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
          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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

          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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
      <div className="flex flex-col gap-5 p-6 rounded-2xl glass-panel shadow-xl">
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
          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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

          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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
      <div className="flex flex-col gap-5 p-6 rounded-2xl glass-panel shadow-xl">
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
          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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

          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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
      <div className="flex flex-col gap-5 p-6 rounded-2xl glass-panel shadow-xl">
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
          <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
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

