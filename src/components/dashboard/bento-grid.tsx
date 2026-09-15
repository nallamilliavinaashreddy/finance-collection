'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Landmark,
  Wallet,
  Coins,
  Receipt,
  Scale,
  Calendar,
  PiggyBank,
  FileText,
  ArrowUpRight,
  Sparkles,
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
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Financial Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Real-time portfolio metrics and daily transaction summary
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] border-slate-300 dark:border-slate-800 text-slate-500">
          LIVE DATA
        </Badge>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Bento Box 1: Total Customers */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-sans">
              {isLoading ? '...' : overall?.totalCustomers ?? 0}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Accounts
            </span>
          </div>
        </Card>

        {/* Bento Box 2: Active Loans */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-sans">
              {isLoading ? '...' : overall?.activeLoansCount ?? 0}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>
        </Card>

        {/* Bento Box 3: Active Investment */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Capital
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.activeInvestment ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Deployed Capital
            </span>
          </div>
        </Card>

        {/* Bento Box 4: Portfolio Interest */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Interest
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.totalInterest ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Interest Earnings
            </span>
          </div>
        </Card>

        {/* Bento Box 5: Remaining Balance */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Principal
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.remainingBalance ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Pending Principal Target
            </span>
          </div>
        </Card>

        {/* Bento Box 6: Today's Collections */}
        <Card className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Today&apos;s Collection
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysCollections ?? 0)}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5 block">
              Live Cash Received
            </span>
          </div>
        </Card>

        {/* Bento Box 7: Today's Expenses */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysExpenses ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Operating Outflow
            </span>
          </div>
        </Card>

        {/* Bento Box 8: Today's Stamp Cost */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Stamp Cost
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysStampCost ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Legal Stamp Expense
            </span>
          </div>
        </Card>

        {/* Bento Box 9: Today's Chit Pay */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Chit Pay
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.todaysChitPayments ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Daily Chit Installment
            </span>
          </div>
        </Card>

        {/* Bento Box 10: This Month Chit Pay */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              This Month Chit Pay
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate block">
              {isLoading ? '...' : formatCurrency(overall?.thisMonthsChitPayments ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              Monthly Accumulated Chit
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
