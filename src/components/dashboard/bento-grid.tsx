'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
  Users,
  Landmark,
  Wallet,
  Coins,
  Receipt,
  Scale,
  Calendar,
  PiggyBank,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface OverallSummary {
  totalCustomers: number;
  activeLoansCount: number;
  activeInvestment: number;
  totalInterest: number;
  remainingBalance: number;
  todaysCollections: number;
  todaysExpenses: number;
  todaysStampCost: number;
  todaysChitPayments: number;
  thisMonthsChitPayments: number;
}

interface BentoGridProps {
  overall?: OverallSummary;
  isLoading?: boolean;
}

export function BentoGrid({ overall, isLoading }: BentoGridProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Financial Command Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Modular Bento Analytics Grid powered by live database streams
            </p>
          </div>
        </div>
        <Badge variant="info" className="font-mono text-[11px] py-1 px-3 shadow-xs">
          BENTO INTELLIGENCE
        </Badge>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento Box 1: Total Customers (Wide Span) */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white/90 to-white dark:from-indigo-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-indigo-200/80 dark:border-indigo-900/50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-sans">
              {isLoading ? '...' : overall?.totalCustomers ?? 0}
            </span>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Verified Accounts
            </span>
          </div>
        </Card>

        {/* Bento Box 2: Active Loans */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/90 to-white dark:from-emerald-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-sans">
              {isLoading ? '...' : overall?.activeLoansCount ?? 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Yield Generating
            </span>
          </div>
        </Card>

        {/* Bento Box 3: Active Investment */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-[#F97316]/10 via-white/90 to-white dark:from-[#F97316]/20 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-[#F97316]/30 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#F97316] uppercase tracking-wider">
              Active Investment
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F97316]/15 flex items-center justify-center text-[#F97316]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-[#F97316] font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.activeInvestment ?? 0)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
              Deployed Capital
            </span>
          </div>
        </Card>

        {/* Bento Box 4: Portfolio Interest */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/90 to-white dark:from-amber-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-amber-200/80 dark:border-amber-900/50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Portfolio Interest
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.totalInterest ?? 0)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
              Total Interest Earnings
            </span>
          </div>
        </Card>

        {/* Bento Box 5: Remaining Balance */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-rose-500/10 via-white/90 to-white dark:from-rose-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-rose-200/80 dark:border-rose-900/50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Remaining Balance
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.remainingBalance ?? 0)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
              Outstanding Principal Target
            </span>
          </div>
        </Card>

        {/* Bento Box 6: Today's Collections */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/90 to-white dark:from-emerald-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Today&apos;s Collections
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysCollections ?? 0)}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-bold mt-1 block">
              Live Cash In Received
            </span>
          </div>
        </Card>

        {/* Bento Box 7: Today's Expenses */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-rose-500/10 via-white/90 to-white dark:from-rose-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-rose-300/80 dark:border-rose-800/60 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Today&apos;s Expenses
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysExpenses ?? 0)}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400 font-bold mt-1 block">
              Operating Cash Out
            </span>
          </div>
        </Card>

        {/* Bento Box 8: Today's Stamp Cost */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-violet-500/10 via-white/90 to-white dark:from-violet-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-violet-200/80 dark:border-violet-900/50 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Today&apos;s Stamp Cost
            </span>
            <div className="w-9 h-9 rounded-2xl bg-violet-500/15 flex items-center justify-center text-violet-600 dark:text-violet-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-violet-600 dark:text-violet-300 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysStampCost ?? 0)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
              Legal Stamp Paper Expense
            </span>
          </div>
        </Card>

        {/* Bento Box 9: Today's Chit Pay */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/90 to-white dark:from-amber-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-amber-300/80 dark:border-amber-800/60 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Today&apos;s Chit Pay
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysChitPayments ?? 0)}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-300 font-bold mt-1 block">
              Daily Chit Installment Out
            </span>
          </div>
        </Card>

        {/* Bento Box 10: This Month Chit Pay */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/90 to-white dark:from-amber-950/30 dark:via-[#0F172A]/90 dark:to-[#0F172A]/95 border border-amber-300/80 dark:border-amber-800/60 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              This Month Chit Pay
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.thisMonthsChitPayments ?? 0)}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-300 font-bold mt-1 block">
              Monthly Accumulated Chit Out
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
