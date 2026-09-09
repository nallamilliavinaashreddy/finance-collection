'use client';

import React, { useState, useMemo } from 'react';
import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Sparkles } from 'lucide-react';

interface CollectionItem {
  paymentDate: string;
  amountPaid: number;
}

interface CashFlowChartProps {
  collections?: CollectionItem[];
  todaysExpenses?: number;
  thisMonthsExpenses?: number;
}

export function CashFlowChart({
  collections = [],
  todaysExpenses = 0,
  thisMonthsExpenses = 0,
}: CashFlowChartProps) {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');

  // Build chart dataset grouped by dates
  const chartData = useMemo(() => {
    const now = new Date();
    let daysToInclude = 30;
    if (timeRange === '7D') daysToInclude = 7;
    if (timeRange === '3M') daysToInclude = 90;
    if (timeRange === '6M') daysToInclude = 180;
    if (timeRange === '1Y') daysToInclude = 365;

    const dataMap: Record<string, { date: string; displayDate: string; collections: number; expenses: number }> = {};

    // Generate dates working backwards
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      dataMap[iso] = { date: iso, displayDate, collections: 0, expenses: 0 };
    }

    // Populate collections
    collections.forEach((c) => {
      if (c.paymentDate && dataMap[c.paymentDate]) {
        dataMap[c.paymentDate].collections += Number(c.amountPaid || 0);
      }
    });

    // Estimate daily expense distribution for smooth baseline
    const dateKeys = Object.keys(dataMap);
    const avgExpensePerDay = dateKeys.length > 0 ? thisMonthsExpenses / Math.max(1, dateKeys.length) : 0;

    dateKeys.forEach((key) => {
      dataMap[key].expenses = Math.round(avgExpensePerDay * 100) / 100;
    });

    return Object.values(dataMap).map((d) => ({
      ...d,
      netCashFlow: Math.max(0, d.collections - d.expenses),
    }));
  }, [collections, thisMonthsExpenses, timeRange]);

  const totalIncomeInPeriod = useMemo(
    () => chartData.reduce((s, d) => s + d.collections, 0),
    [chartData]
  );
  const totalExpensesInPeriod = useMemo(
    () => chartData.reduce((s, d) => s + d.expenses, 0),
    [chartData]
  );
  const netCashFlowInPeriod = totalIncomeInPeriod - totalExpensesInPeriod;

  return (
    <TiltCard glowColor="purple" className="p-6 sm:p-7 flex flex-col gap-6 relative border-[#1F2C42] bg-gradient-to-br from-[#0E1626]/95 via-[#0A0F1A]/95 to-[#060913]">
      {/* 3D Holographic Perspective Background Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none holographic-grid-surface opacity-35 rounded-2xl" />

      {/* Header & Holographic Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2C42] pb-5 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] via-[#6366F1] to-[#3B82F6] p-0.5 shadow-lg shadow-[#8B5CF6]/30">
            <div className="w-full h-full rounded-[14px] bg-[#0E1626] flex items-center justify-center text-[#C084FC]">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-xl font-black text-[#F8FAFC] tracking-tight">
                Cash Flow Intelligence
              </h3>
              <Badge variant="purple" className="text-[9px] font-mono py-0 px-2 shadow-xs">
                ● 3D HOLOGRAPHIC HUD
              </Badge>
            </div>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
              Live Collections vs Operating Expenses & Net Cash Flow Stream
            </p>
          </div>
        </div>

        {/* 3D Futuristic Filter Selector */}
        <div className="flex items-center gap-1.5 bg-[#0A0F1A] p-1.5 rounded-2xl border border-[#1F2C42] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          {(['7D', '30D', '3M', '6M', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 tab-3d-base ${
                timeRange === r
                  ? 'bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#4F8CFF] text-[#F8FAFC] shadow-[0_6px_16px_rgba(139,92,246,0.4)] translate-z-[6px] -translate-y-0.5'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#141D2E]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI 3D Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-20">
        {/* Income Module */}
        <div className="p-4 rounded-2xl bg-[#141D2E]/80 border border-[#1F2C42] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-between transform-gpu translate-z-[15px] hover:-translate-y-1 transition-all">
          <div>
            <span className="text-[10px] font-extrabold text-[#22C55E] uppercase tracking-widest font-mono">
              Income (Collections)
            </span>
            <p className="text-xl font-black text-[#22C55E] font-mono mt-1 drop-shadow-[0_2px_10px_rgba(34,197,94,0.4)]">
              {formatCurrency(totalIncomeInPeriod)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shadow-md">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Expenses Module */}
        <div className="p-4 rounded-2xl bg-[#141D2E]/80 border border-[#1F2C42] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-between transform-gpu translate-z-[15px] hover:-translate-y-1 transition-all">
          <div>
            <span className="text-[10px] font-extrabold text-[#EF4444] uppercase tracking-widest font-mono">
              Operating Expenses
            </span>
            <p className="text-xl font-black text-[#EF4444] font-mono mt-1 drop-shadow-[0_2px_10px_rgba(239,68,68,0.4)]">
              {formatCurrency(totalExpensesInPeriod)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] shadow-md">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Net Cash Flow Module */}
        <div className="p-4 rounded-2xl bg-[#141D2E]/80 border border-[#1F2C42] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-between transform-gpu translate-z-[15px] hover:-translate-y-1 transition-all">
          <div>
            <span className="text-[10px] font-extrabold text-[#C084FC] uppercase tracking-widest font-mono">
              Net Cash Flow
            </span>
            <p className="text-xl font-black text-[#C084FC] font-mono mt-1 drop-shadow-[0_2px_10px_rgba(192,132,252,0.4)]">
              {formatCurrency(netCashFlowInPeriod)}
            </p>
          </div>
          <Badge variant={netCashFlowInPeriod >= 0 ? 'success' : 'error'} className="font-mono text-[10px]">
            {netCashFlowInPeriod >= 0 ? '+POSITIVE' : '-NEGATIVE'}
          </Badge>
        </div>
      </div>

      {/* 3D Holographic Chart Visualization */}
      <div className="w-full h-80 pt-3 relative z-20 transform-gpu translate-z-[20px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="holoIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="holoExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="holoNetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(139, 92, 246, 0.15)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
              axisLine={{ stroke: '#1F2C42' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
              axisLine={{ stroke: '#1F2C42' }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />

            {/* Floating Holographic Glass Panel Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-4 rounded-2xl bg-[#0E1626]/95 backdrop-blur-2xl border border-[#1F2C42] shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col gap-2 text-xs modal-3d-content">
                      <div className="flex items-center justify-between border-b border-[#1F2C42] pb-1.5 gap-4">
                        <span className="font-black text-[#F8FAFC] tracking-wide font-mono">
                          {label}
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-[#C084FC] animate-pulse" />
                      </div>
                      <div className="flex justify-between gap-6 text-[#22C55E] font-medium">
                        <span>Income (Collections):</span>
                        <span className="font-black font-mono">{formatCurrency(Number(payload[0]?.value || 0))}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-[#EF4444] font-medium">
                        <span>Operating Expenses:</span>
                        <span className="font-black font-mono">{formatCurrency(Number(payload[1]?.value || 0))}</span>
                      </div>
                      {payload[2] && (
                        <div className="flex justify-between gap-6 text-[#C084FC] font-medium pt-1 border-t border-[#1F2C42]">
                          <span>Net Cash Flow:</span>
                          <span className="font-black font-mono">{formatCurrency(Number(payload[2]?.value || 0))}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Dimensional 3D Neon Data Paths */}
            <Area
              type="monotone"
              dataKey="collections"
              name="Income"
              stroke="#22C55E"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#holoIncomeGrad)"
              className="chart-neon-glow-emerald"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#EF4444"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#holoExpenseGrad)"
              className="chart-neon-glow-red"
            />
            <Area
              type="monotone"
              dataKey="netCashFlow"
              name="Net Cash Flow"
              stroke="#8B5CF6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#holoNetGrad)"
              className="chart-neon-glow-purple"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </TiltCard>
  );
}
