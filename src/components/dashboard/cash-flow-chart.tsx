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
import { TrendingUp, ArrowUpRight } from 'lucide-react';

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
  thisMonthsExpenses = 0,
}: CashFlowChartProps) {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');

  const chartData = useMemo(() => {
    const now = new Date();
    let daysToInclude = 30;
    if (timeRange === '7D') daysToInclude = 7;
    if (timeRange === '3M') daysToInclude = 90;
    if (timeRange === '6M') daysToInclude = 180;
    if (timeRange === '1Y') daysToInclude = 365;

    const dataMap: Record<string, { date: string; displayDate: string; collections: number; expenses: number }> = {};

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

    collections.forEach((c) => {
      if (c.paymentDate && dataMap[c.paymentDate]) {
        dataMap[c.paymentDate].collections += Number(c.amountPaid || 0);
      }
    });

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
    <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-5 rounded-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Cash Flow Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Inflow vs Outflow tracking across active accounting window
            </p>
          </div>
        </div>

        {/* Time Range Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          {(['7D', '30D', '3M', '6M', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                timeRange === r
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Inflow Collections
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalIncomeInPeriod)}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Outflow Expenses
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(totalExpensesInPeriod)}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Net Surplus
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(netCashFlowInPeriod)}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const colls = Number(payload[0]?.value || 0);
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs shadow-md border border-slate-800">
                      <p className="font-semibold text-slate-300">{label}</p>
                      <p className="font-bold text-blue-400 mt-1">
                        Collection: {formatCurrency(colls)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="collections"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCollections)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
