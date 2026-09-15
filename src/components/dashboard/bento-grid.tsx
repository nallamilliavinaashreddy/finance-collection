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

import { ThreeDCardPanel } from '@/components/ui/threed-card-panel';

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
    <div className="flex flex-col gap-4 preserve-3d">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 threed-layer-depth-1">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 preserve-3d">
        {/* Bento Box 1: Total Customers */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-soul-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                [01] TOTAL CUSTOMERS
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 group-hover:border-orange-400 transition-all threed-layer-depth-2">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between threed-layer-depth-1">
              <span className="text-2xl font-black text-white font-sans tabular-nums">
                {isLoading ? '...' : overall?.totalCustomers ?? 0}
              </span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 font-semibold">
                VERIFIED
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 2: Active Loans */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-power-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                [02] ACTIVE LOANS
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 group-hover:border-purple-400 transition-all threed-layer-depth-2">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between threed-layer-depth-1">
              <span className="text-2xl font-black text-white font-sans tabular-nums">
                {isLoading ? '...' : overall?.activeLoansCount ?? 0}
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-semibold">
                ACTIVE YIELD
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 3: Active Investment */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-space-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                [03] DEPLOYED CAPITAL
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 group-hover:border-cyan-400 transition-all threed-layer-depth-2">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-white font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.activeInvestment ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Active Investment Pool
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 4: Portfolio Interest */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-mind-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                [04] TARGET INTEREST
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:border-yellow-400 transition-all threed-layer-depth-2">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-amber-400 font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.totalInterest ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Interest Earnings Target
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 5: Remaining Balance */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-power-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                [05] OUTSTANDING BAL
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 group-hover:border-purple-400 transition-all threed-layer-depth-2">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-white font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.remainingBalance ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Pending Principal Target
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 6: Today's Collections */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-space-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                [06] TODAY COLLECTIONS
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-sky-500/20 group-hover:border-cyan-400 group-hover:text-cyan-400 transition-all threed-layer-depth-2">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-emerald-400 font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysCollections ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">
                Live Cash Received
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 7: Today's Expenses */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-reality-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider group-hover:text-rose-300 transition-colors">
                [07] TODAY EXPENSES
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/30 group-hover:border-rose-400 transition-all threed-layer-depth-2">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-rose-400 font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysExpenses ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-rose-400/80 font-mono mt-0.5 block">
                Operating Outflow
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 8: Today's Stamp Cost */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-mind-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                [08] STAMP COST
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-amber-500/20 group-hover:border-yellow-400 group-hover:text-amber-400 transition-all threed-layer-depth-2">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-white font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysStampCost ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Legal Stamp Cost
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 9: Today's Chit Pay */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-time-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                [09] DAILY CHIT
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 group-hover:text-emerald-400 transition-all threed-layer-depth-2">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-white font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysChitPayments ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Daily Chit Outflow
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>

        {/* Bento Box 10: This Month Chit Pay */}
        <ThreeDCardPanel depthPx={12} hoverElevatePx={8}>
          <Card className="p-4 rounded-2xl border border-sky-500/20 bg-slate-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between relative group hover-time-stone cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                [10] MONTH CHIT PAY
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 group-hover:text-emerald-400 transition-all threed-layer-depth-2">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 threed-layer-depth-1">
              <span className="text-xl font-black text-white font-sans tabular-nums truncate block">
                {isLoading ? '...' : <AnimatedNumber value={overall?.thisMonthsChitPayments ?? 0} formatAsCurrency />}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                Monthly Accumulated Chit
              </span>
            </div>
          </Card>
        </ThreeDCardPanel>
      </div>
    </div>
  );
}
