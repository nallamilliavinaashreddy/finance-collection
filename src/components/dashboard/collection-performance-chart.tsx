'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface CollectionItem {
  paymentDate: string;
  amountPaid: number;
}

interface CollectionPerformanceChartProps {
  collections?: CollectionItem[];
}

export function CollectionPerformanceChart({ collections = [] }: CollectionPerformanceChartProps) {
  const barData = useMemo(() => {
    const now = new Date();
    const map: Record<string, { displayDate: string; total: number }> = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      map[iso] = { displayDate, total: 0 };
    }

    collections.forEach((c) => {
      if (c.paymentDate && map[c.paymentDate]) {
        map[c.paymentDate].total += Number(c.amountPaid || 0);
      }
    });

    return Object.values(map);
  }, [collections]);

  const maxTotal = useMemo(() => Math.max(1, ...barData.map((d) => d.total)), [barData]);

  return (
    <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-4 rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              14-Day Collection Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily collection volume distribution
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200 dark:border-slate-800">
          DAILY VOLUME
        </Badge>
      </div>

      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900 text-white shadow-md text-xs border border-slate-800">
                      <span className="font-semibold text-slate-300">{label}: </span>
                      <span className="font-mono font-bold text-blue-400">
                        {formatCurrency(Number(payload[0]?.value || 0))}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total === maxTotal && maxTotal > 0 ? '#2563EB' : '#3B82F6'}
                  opacity={entry.total > 0 ? 0.85 : 0.2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
