'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import {
  Activity,
  Cpu,
  RefreshCw,
  Zap,
  TrendingUp,
  ShieldCheck,
  CircleDot,
  Radio,
} from 'lucide-react';

interface OverallSummary {
  totalCustomers: number;
  activeLoansCount: number;
  activeInvestment: number;
  totalInterest: number;
  remainingBalance: number;
  todaysCollections: number;
  todaysExpenses: number;
  thisMonthsExpenses: number;
}

interface FinCollectCoreHeroProps {
  overall?: OverallSummary;
  netProfit?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function FinCollectCoreHero({
  overall,
  netProfit = 0,
  isLoading = false,
  onRefresh,
}: FinCollectCoreHeroProps) {
  const todayISO = new Date().toISOString().split('T')[0];
  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0F172A]/90 via-[#0B0F17]/95 to-[#070A12] backdrop-blur-2xl border border-sky-500/20 shadow-2xl overflow-hidden flex flex-col gap-6">
      {/* Background Micro Scanline Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

      {/* Background Arc Glow Spheres */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top HUD Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-sky-500/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
                FINCOLLECT CORE
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded uppercase tracking-widest">
                [SYS.ONLINE]
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>JARVIS Financial Telemetry OS</span>
              <span className="text-sky-500/40">•</span>
              <span className="text-sky-400 font-mono text-[11px]">{formattedToday}</span>
            </p>
          </div>
        </div>

        {/* Telemetry System Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1.5 py-1 px-3">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            LIVE POSTGRESQL SYNC
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-mono text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>[REFRESH]</span>
          </Button>
        </div>
      </div>

      {/* Main ARC-REACTOR Financial Center Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 py-2">
        {/* Left Telemetry Cluster */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 backdrop-blur-md flex items-center justify-between hover-space-stone cursor-pointer group">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block group-hover:text-cyan-400 transition-colors">
                [INFLOW] TODAY COLLECTIONS
              </span>
              <span className="text-xl font-bold font-mono text-sky-400">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysCollections ?? 0} formatAsCurrency />}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono text-xs group-hover:bg-sky-500/20 group-hover:border-sky-400 transition-all">
              ⚡
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 backdrop-blur-md flex items-center justify-between hover-reality-stone cursor-pointer group">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block group-hover:text-rose-400 transition-colors">
                [OUTFLOW] TODAY EXPENSES
              </span>
              <span className="text-xl font-bold font-mono text-rose-400">
                {isLoading ? '...' : <AnimatedNumber value={overall?.todaysExpenses ?? 0} formatAsCurrency />}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono text-xs group-hover:bg-rose-500/20 group-hover:border-rose-400 transition-all">
              🔻
            </div>
          </div>
        </div>

        {/* Center Arc-Reactor Radial HUD Display */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-4">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
            {/* Outer Concentric Arc Rings */}
            <div className="absolute inset-0 rounded-full border border-sky-500/20 arc-reactor-ring border-t-sky-400 border-r-blue-500" />
            <div className="absolute inset-3 rounded-full border border-sky-500/15 arc-reactor-reverse border-b-emerald-400 border-l-purple-500" />
            <div className="absolute inset-6 rounded-full border border-dashed border-sky-500/25 arc-reactor-ring" />

            {/* Central Glowing Core Panel */}
            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0B0F17] border border-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.2)] flex flex-col items-center justify-center p-3 text-center relative z-10 hover-time-stone cursor-pointer transition-all duration-500 group">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-400 mb-1 group-hover:text-emerald-400 transition-colors">
                SYSTEM NET SURPLUS
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white group-hover:scale-105 transition-transform">
                {isLoading ? '...' : <AnimatedNumber value={netProfit} formatAsCurrency />}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                HEALTH: OPTIMAL
              </span>
            </div>
          </div>
        </div>

        {/* Right Telemetry Cluster */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 backdrop-blur-md flex items-center justify-between hover-power-stone cursor-pointer group">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block group-hover:text-purple-400 transition-colors">
                [PORTFOLIO] ACTIVE LOANS
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {isLoading ? '...' : overall?.activeLoansCount ?? 0} <span className="text-xs text-slate-400 font-normal">Active</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono text-xs group-hover:bg-purple-500/20 group-hover:border-purple-400 transition-all">
              🔮
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 backdrop-blur-md flex items-center justify-between hover-mind-stone cursor-pointer group">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block group-hover:text-yellow-400 transition-colors">
                [CAPITAL] OUTSTANDING PRINCIPAL
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {isLoading ? '...' : <AnimatedNumber value={overall?.remainingBalance ?? 0} formatAsCurrency />}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-xs group-hover:bg-amber-500/20 group-hover:border-yellow-400 transition-all">
              💎
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sky-500/15 text-[10px] font-mono text-slate-400 relative z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sky-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            TELEMETRY ENGINE: ACTIVE
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline">NODES: 4 ACTIVE MODULES</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">ENCRYPTION: AES-256</span>
          <span className="text-emerald-400">READ-ONLY SAFEGUARD ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
