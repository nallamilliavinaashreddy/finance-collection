'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { getBalanceSheetData, BalanceSheetData, BalanceSheetItem } from '@/lib/actions/balance-sheet';
import {
  Scale,
  Calendar,
  RefreshCw,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Assets' | 'Liabilities' | "Owner's Capital">('All');
  const { showToast } = useToast();

  const fetchBalanceSheet = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBalanceSheetData(asOfDate);
      setData(res);
    } catch (err) {
      console.error('Failed to load balance sheet:', err);
      showToast('Failed to calculate Balance Sheet. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [asOfDate, showToast]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  // Filtered breakdown table data
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesSearch =
        item.particulars.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data?.items, categoryFilter, searchQuery]);

  const columns: ColumnDef<BalanceSheetItem>[] = [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.category === 'Assets'
              ? 'success'
              : row.original.category === 'Liabilities'
              ? 'error'
              : 'warning'
          }
          className="font-mono text-[10px]"
        >
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'particulars',
      header: 'Particulars',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-white">
            {row.original.particulars}
          </span>
          {row.original.note && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.original.note}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount (₹)',
      cell: ({ row }) => (
        <span
          className={`font-black text-sm font-mono ${
            row.original.category === 'Assets'
              ? 'text-emerald-600 dark:text-emerald-400'
              : row.original.category === 'Liabilities'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-[#FF7A00]'
          }`}
        >
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'lastUpdated',
      header: 'As of Date',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDate(row.original.lastUpdated)}
        </span>
      ),
    },
  ];

  const summary = data?.summary;
  const assets = data?.assets;
  const liabilities = data?.liabilities;
  const capital = data?.ownersCapital;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header Hero Banner */}
      <div className="rounded-2xl p-6 glass-panel shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Balance Sheet
            </h2>
            <Badge variant="success" className="gap-1 text-[10px] shadow-xs">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Complete financial position of the business at a glance.
          </p>
        </div>

        {/* Date Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 px-3 py-1.5 rounded-xl shadow-xs backdrop-blur-md">
            <Calendar className="w-4 h-4 text-[#FF7A00]" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchBalanceSheet}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="rounded-xl border-slate-300 dark:border-[#262626] bg-white/50 dark:bg-[#141414]/50 backdrop-blur-md shadow-xs hover:border-[#FF7A00]/50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4 TOP SUMMARY METRIC CARDS */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Assets */}
        <Card className="p-5 flex flex-col justify-between border-emerald-500/30 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white/80 to-white dark:via-[#111111]/90 dark:to-[#111111]/95 glass-card shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-3 truncate">
            {isLoading ? '...' : <AnimatedNumber value={assets?.totalAssets ?? 0} formatAsCurrency />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Cash + Loans Receivable + Investments</p>
        </Card>

        {/* 2. Total Liabilities */}
        <Card className="p-5 flex flex-col justify-between border-rose-500/30 dark:border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-white/80 to-white dark:via-[#111111]/90 dark:to-[#111111]/95 glass-card shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Total Liabilities
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-3 truncate">
            {isLoading ? '...' : <AnimatedNumber value={liabilities?.totalLiabilities ?? 0} formatAsCurrency />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Depositor Payables & Other Payables</p>
        </Card>

        {/* 3. Owner's Capital */}
        <Card className="p-5 flex flex-col justify-between border-[#FF7A00]/30 dark:border-[#FF7A00]/30 bg-gradient-to-br from-amber-500/10 via-white/80 to-white dark:via-[#111111]/90 dark:to-[#111111]/95 glass-card shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider">
              Owner&apos;s Capital
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/15 flex items-center justify-center text-[#FF7A00]">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FF7A00] mt-3 truncate">
            {isLoading ? '...' : <AnimatedNumber value={capital?.totalCapitalAndRetained ?? 0} formatAsCurrency />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Current Capital + Retained Profit</p>
        </Card>

        {/* 4. Net Position */}
        <Card className="p-5 flex flex-col justify-between border-violet-500/30 dark:border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-white/80 to-white dark:via-[#111111]/90 dark:to-[#111111]/95 glass-card shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Net Position
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-600 dark:text-violet-300">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-300 mt-3 truncate">
            {isLoading ? '...' : <AnimatedNumber value={summary?.netPosition ?? 0} formatAsCurrency />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Total Assets - Total Liabilities</p>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* MAIN BALANCE SHEET: 2-COLUMN ASSETS VS LIABILITIES & CAPITAL */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: ASSETS */}
        <div className="flex flex-col gap-4">
          <Card className="p-6 glass-panel shadow-xl flex flex-col gap-5 border-emerald-500/20">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Assets (What We Own)
                </h3>
              </div>
              <Badge variant="success" className="font-mono text-[10px]">
                ASSETS
              </Badge>
            </div>

            {/* Asset Items List */}
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Cash in Hand</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Current available physical & central cash balance</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(assets?.cashInHand ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Cash in Bank</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Bank account balances</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(assets?.cashInBank ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">3. Loans Receivable</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Total outstanding loan balance expected from customers</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(assets?.loansReceivable ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">4. Active Investment</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Current active capital deployed in Investment Khata</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(assets?.activeInvestment ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">5. Other Assets (Stamps)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Physical stamp inventory and legal holdings</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(assets?.otherAssets ?? 0)}
                </span>
              </div>
            </div>

            {/* Total Assets Summary Footer */}
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between mt-2">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                TOTAL ASSETS
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isLoading ? '...' : formatCurrency(assets?.totalAssets ?? 0)}
              </span>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIABILITIES & OWNER'S CAPITAL */}
        <div className="flex flex-col gap-6">
          {/* 1. LIABILITIES CARD */}
          <Card className="p-6 glass-panel shadow-xl flex flex-col gap-5 border-rose-500/20">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Liabilities (What We Owe)
                </h3>
              </div>
              <Badge variant="error" className="font-mono text-[10px]">
                LIABILITIES
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Deposits / Amount Payable</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Total principal payable to active depositors</p>
                </div>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400 font-mono">
                  {isLoading ? '...' : formatCurrency(liabilities?.depositsPayable ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Other Payables</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pending operational or vendor payables</p>
                </div>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400 font-mono">
                  {isLoading ? '...' : formatCurrency(liabilities?.otherPayables ?? 0)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between">
              <span className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                TOTAL LIABILITIES
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {isLoading ? '...' : formatCurrency(liabilities?.totalLiabilities ?? 0)}
              </span>
            </div>
          </Card>

          {/* 2. OWNER'S CAPITAL CARD */}
          <Card className="p-6 glass-panel shadow-xl flex flex-col gap-5 border-[#FF7A00]/20">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Owner&apos;s Capital & Earnings
                </h3>
              </div>
              <Badge variant="warning" className="font-mono text-[10px]">
                CAPITAL
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Capital Added</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative direct capital invested by owner</p>
                </div>
                <span className="font-bold text-sm text-[#FF7A00] font-mono">
                  {isLoading ? '...' : formatCurrency(capital?.totalCapitalAdded ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Capital Withdrawn (-)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative business capital taken out by owner</p>
                </div>
                <span className="font-bold text-sm text-rose-500 font-mono">
                  {isLoading ? '...' : formatCurrency(capital?.capitalWithdrawn ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#FF7A00]">Current Owner&apos;s Capital</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Capital Added - Capital Withdrawn</p>
                </div>
                <span className="font-black text-sm text-[#FF7A00] font-mono">
                  {isLoading ? '...' : formatCurrency(capital?.currentOwnerCapital ?? 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Retained Earnings / Accumulated Profit</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative net profit retained in business</p>
                </div>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(capital?.retainedEarnings ?? 0)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FF7A00]/15 border border-[#FF7A00]/30 flex items-center justify-between">
              <span className="text-sm font-black text-[#FF7A00] uppercase tracking-wider">
                TOTAL OWNER&apos;S CAPITAL & PROFIT
              </span>
              <span className="text-xl font-black text-[#FF7A00] font-mono">
                {isLoading ? '...' : formatCurrency(capital?.totalCapitalAndRetained ?? 0)}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ================================================================ */}
      {/* BALANCE CHECK BANNER */}
      {/* ================================================================ */}
      <Card className="p-6 glass-panel shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-[#FF7A00]/30 bg-gradient-to-r from-white/90 via-slate-50/80 to-amber-500/10 dark:from-[#111111]/90 dark:via-[#141414]/85 dark:to-[#FF7A00]/10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
            summary?.isBalanced
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-amber-500 text-white shadow-amber-500/20'
          }`}>
            {summary?.isBalanced ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Accounting Balance Verification
              </h3>
              <Badge
                variant={summary?.isBalanced ? 'success' : 'warning'}
                className="font-mono text-xs py-0.5 px-2"
              >
                {summary?.isBalanced ? '✓ Balanced' : '⚠ Needs Review'}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
              TOTAL ASSETS ({formatCurrency(summary?.totalAssets ?? 0)}) = TOTAL LIABILITIES ({formatCurrency(summary?.totalLiabilities ?? 0)}) + OWNER&apos;S CAPITAL ({formatCurrency(summary?.ownersCapitalTotal ?? 0)})
            </p>
          </div>
        </div>

        <div className="flex flex-col text-right shrink-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Balance Difference
          </span>
          <span className={`text-xl font-black font-mono ${summary?.isBalanced ? 'text-emerald-500' : 'text-amber-500'}`}>
            {formatCurrency(summary?.difference ?? 0)}
          </span>
        </div>
      </Card>

      {/* ================================================================ */}
      {/* DETAILED BREAKDOWN TABLE */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF7A00]" />
            Detailed Balance Sheet Item Breakdown
            <Badge variant="outline" className="font-mono text-xs">
              {filteredItems.length} Records
            </Badge>
          </h3>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search particulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 h-9 pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141414] p-1 rounded-xl border border-slate-200 dark:border-[#262626]">
              {(['All', 'Assets', 'Liabilities', "Owner's Capital"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    categoryFilter === cat
                      ? 'bg-[#FF7A00] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="glass-panel overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredItems}
            emptyText={isLoading ? 'Loading Balance Sheet breakdown...' : 'No balance sheet records found.'}
            pageSize={10}
          />
        </Card>
      </div>
    </div>
  );
}
