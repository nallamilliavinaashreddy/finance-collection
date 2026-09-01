'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart, DollarSign } from 'lucide-react';

interface MonthlyInsightsChartProps {
  todaysCollections?: number;
  thisMonthsExpenses?: number;
  loanInterest?: number;
  todaysStampCost?: number;
  thisMonthsChitPayments?: number;
}

export function MonthlyInsightsChart({
  todaysCollections = 0,
  thisMonthsExpenses = 0,
  loanInterest = 0,
  todaysStampCost = 0,
  thisMonthsChitPayments = 0,
}: MonthlyInsightsChartProps) {
  const pieData = useMemo(() => {
    return [
      { name: 'Collections', value: todaysCollections, color: '#10B981' },
      { name: 'Loan Interest', value: loanInterest, color: '#FF7A00' },
      { name: 'Expenses', value: thisMonthsExpenses, color: '#EF4444' },
      { name: 'Stamp Costs', value: todaysStampCost, color: '#8B5CF6' },
      { name: 'Chit Payments', value: thisMonthsChitPayments, color: '#F59E0B' },
    ].filter((item) => item.value > 0);
  }, [todaysCollections, thisMonthsExpenses, loanInterest, todaysStampCost, thisMonthsChitPayments]);

  const grandTotal = useMemo(
    () => pieData.reduce((sum, item) => sum + item.value, 0),
    [pieData]
  );

  return (
    <Card className="p-6 glass-panel shadow-xl flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Portfolio Allocation
          </h3>
        </div>
        <Badge variant="info" className="font-mono text-[10px]">
          LIVE ALLOCATION
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="w-44 h-44 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={pieData.length > 0 ? pieData : [{ name: 'Empty', value: 1, color: '#94A3B8' }]}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {(pieData.length > 0 ? pieData : [{ name: 'Empty', value: 1, color: '#94A3B8' }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    return (
                      <div className="p-2.5 rounded-xl bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl border border-slate-200 dark:border-[#262626] shadow-xl text-xs font-semibold">
                        <span style={{ color: item.payload.color }}>{item.name}: </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(Number(item.value || 0))}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RechartsPie>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono truncate px-1">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Breakdown Legend */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          {pieData.map((item) => {
            const pct = grandTotal > 0 ? Math.round((item.value / grandTotal) * 100) : 0;
            return (
              <div
                key={item.name}
                className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
