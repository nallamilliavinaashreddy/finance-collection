'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

interface CollectionItem {
  id?: string;
  paymentDate: string;
  amountPaid: number;
}

interface ExpenseItem {
  id?: string;
  expenseDate: string;
  amount: number;
  category?: string;
}

interface CashFlowChartProps {
  collections?: CollectionItem[];
  expenses?: ExpenseItem[];
}

/**
 * Safely normalizes date strings to 'YYYY-MM-DD' in local calendar time
 */
const normalizeDateStr = (dateVal?: string | null): string => {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  // Strip time component if present (e.g. "2026-09-14T09:12:10.194Z" -> "2026-09-14")
  const ymd = str.split('T')[0].split(' ')[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return ymd;
  }
  return '';
};

export function CashFlowChart({
  collections = [],
  expenses = [],
}: CashFlowChartProps) {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');

  // Build time-series dataset with per-day collections AND expenses
  const chartData = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    let daysToInclude = 30;
    if (timeRange === '7D') daysToInclude = 7;
    if (timeRange === '3M') daysToInclude = 90;
    if (timeRange === '6M') daysToInclude = 180;
    if (timeRange === '1Y') daysToInclude = 365;

    const dataMap: Record<
      string,
      { date: string; displayDate: string; fullDateLabel: string; collections: number; expenses: number; netCashFlow: number }
    > = {};

    // 1. Initialize timeline sequentially in local time zone from (today - daysToInclude + 1) to today
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(todayYear, todayMonth, todayDate - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const displayDate = d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });

      const fullDateLabel = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      dataMap[isoDate] = {
        date: isoDate,
        displayDate,
        fullDateLabel,
        collections: 0,
        expenses: 0,
        netCashFlow: 0,
      };
    }

    // 2. Aggregate live actual collections by paymentDate (exact date sum)
    collections.forEach((c) => {
      const dateKey = normalizeDateStr(c.paymentDate);
      if (dateKey && dataMap[dateKey]) {
        const amt = Number(c.amountPaid || 0);
        if (!isNaN(amt) && amt > 0) {
          dataMap[dateKey].collections += amt;
        }
      }
    });

    // 3. Aggregate live actual expenses by expenseDate (exact date sum)
    expenses.forEach((e) => {
      const dateKey = normalizeDateStr(e.expenseDate);
      if (dateKey && dataMap[dateKey]) {
        const amt = Number(e.amount || 0);
        if (!isNaN(amt) && amt > 0) {
          dataMap[dateKey].expenses += amt;
        }
      }
    });

    // 4. Calculate Net Cash Flow per day
    return Object.values(dataMap).map((d) => ({
      ...d,
      netCashFlow: d.collections - d.expenses,
    }));
  }, [collections, expenses, timeRange]);

  // Calculate Period Summary KPI totals for selected range
  const totalInflowCollections = useMemo(
    () => chartData.reduce((s, d) => s + d.collections, 0),
    [chartData]
  );

  const totalOutflowExpenses = useMemo(
    () => chartData.reduce((s, d) => s + d.expenses, 0),
    [chartData]
  );

  const netSurplusInPeriod = totalInflowCollections - totalOutflowExpenses;

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
              Cash Flow Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              True Daily Time Series: Collections vs Expenses
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

      {/* Summary KPI Cards for Selected Filter Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Inflow Collections ({timeRange})
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(totalInflowCollections)}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-blue-500" />
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Operating Expenses ({timeRange})
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(totalOutflowExpenses)}
            </span>
          </div>
          <ArrowDownRight className="w-4 h-4 text-rose-500" />
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Net Cash Flow ({timeRange})
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                netSurplusInPeriod >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netSurplusInPeriod)}
            </span>
          </div>
          <Scale className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Dual Series Recharts Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
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
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0]?.payload;
                  const label = dataPoint?.fullDateLabel || dataPoint?.displayDate || '';
                  const colls = Number(payload.find((p) => p.dataKey === 'collections')?.value || 0);
                  const exps = Number(payload.find((p) => p.dataKey === 'expenses')?.value || 0);
                  const net = colls - exps;

                  return (
                    <div className="p-3 rounded-lg bg-slate-900 text-white text-xs shadow-md border border-slate-800 min-w-[180px] space-y-1">
                      <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                      <div className="flex justify-between items-center text-blue-400 pt-0.5">
                        <span>Collections:</span>
                        <span className="font-mono font-bold">{formatCurrency(colls)}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-400">
                        <span>Expenses:</span>
                        <span className="font-mono font-bold">{formatCurrency(exps)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1">
                        <span>Net Cash Flow:</span>
                        <span
                          className={`font-mono font-bold ${
                            net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="collections"
              name="Inflow Collections"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCollections)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Outflow Expenses"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
