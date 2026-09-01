'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
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
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    <Card className="p-6 glass-panel shadow-xl flex flex-col gap-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-[#262626]/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
              Cash Flow Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live Income (Collections) vs Operating Expenses & Net Cash Flow
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141414] p-1 rounded-xl border border-slate-200 dark:border-[#262626]">
          {(['7D', '30D', '3M', '6M', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === r
                  ? 'bg-[#FF7A00] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Income (Collections)
            </span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalIncomeInPeriod)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Operating Expenses
            </span>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {formatCurrency(totalExpensesInPeriod)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
              Net Cash Flow
            </span>
            <p className="text-lg font-black text-violet-600 dark:text-violet-300 font-mono mt-0.5">
              {formatCurrency(netCashFlowInPeriod)}
            </p>
          </div>
          <Badge variant={netCashFlowInPeriod >= 0 ? 'success' : 'error'} className="font-mono text-[10px]">
            {netCashFlowInPeriod >= 0 ? '+POSITIVE' : '-NEGATIVE'}
          </Badge>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl border border-slate-200 dark:border-[#262626] shadow-xl flex flex-col gap-1 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
                        {label}
                      </span>
                      <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Income (Collections):</span>
                        <span className="font-bold font-mono">{formatCurrency(Number(payload[0]?.value || 0))}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-rose-500 font-medium">
                        <span>Expenses:</span>
                        <span className="font-bold font-mono">{formatCurrency(Number(payload[1]?.value || 0))}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="collections"
              name="Income"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
