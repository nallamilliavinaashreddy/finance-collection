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
  FileText,
  ArrowUpRight,
  Sparkles,
  Cpu,
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight font-mono">
              HUD TELEMETRY PANELS
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Modular financial diagnostic telemetry grid
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] border-sky-500/30 text-sky-400 bg-sky-500/10">
          [10 TELEMETRY MODULES]
        </Badge>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Bento Box 1: Total Customers */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [01] TOTAL CUSTOMERS
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {isLoading ? '...' : overall?.totalCustomers ?? 0}
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              VERIFIED
            </span>
          </div>
        </Card>

        {/* Bento Box 2: Active Loans */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [02] ACTIVE LOANS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {isLoading ? '...' : overall?.activeLoansCount ?? 0}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ACTIVE YIELD
            </span>
          </div>
        </Card>

        {/* Bento Box 3: Active Investment */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [03] DEPLOYED CAPITAL
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.activeInvestment ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Active Investment Pool
            </span>
          </div>
        </Card>

        {/* Bento Box 4: Portfolio Interest */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [04] TARGET INTEREST
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-amber-400 font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.totalInterest ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Interest Earnings Target
            </span>
          </div>
        </Card>

        {/* Bento Box 5: Remaining Balance */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [05] OUTSTANDING BAL
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.remainingBalance ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Pending Principal Target
            </span>
          </div>
        </Card>

        {/* Bento Box 6: Today's Collections */}
        <Card className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              [06] TODAY COLLECTIONS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-emerald-400 font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.todaysCollections ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">
              Live Cash Received
            </span>
          </div>
        </Card>

        {/* Bento Box 7: Today's Expenses */}
        <Card className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
              [07] TODAY EXPENSES
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-rose-400 font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.todaysExpenses ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-rose-400/80 font-mono mt-0.5 block">
              Operating Outflow
            </span>
          </div>
        </Card>

        {/* Bento Box 8: Today's Stamp Cost */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [08] STAMP COST
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.todaysStampCost ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Legal Stamp Cost
            </span>
          </div>
        </Card>

        {/* Bento Box 9: Today's Chit Pay */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [09] DAILY CHIT
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.todaysChitPayments ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Daily Chit Outflow
            </span>
          </div>
        </Card>

        {/* Bento Box 10: This Month Chit Pay */}
        <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              [10] MONTH CHIT PAY
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white font-mono truncate block">
              {isLoading ? '...' : <AnimatedNumber value={overall?.thisMonthsChitPayments ?? 0} formatAsCurrency />}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Monthly Accumulated Chit
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
