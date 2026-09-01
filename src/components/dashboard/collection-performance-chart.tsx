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
  // Group collections by day for the last 14 days
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
    <Card className="p-6 glass-panel shadow-xl flex flex-col justify-between gap-6 border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Collection Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              14-Day Collection Entry Performance Stream
            </p>
          </div>
        </div>
        <Badge variant="info" className="font-mono text-[10px]">
          BAR STREAM
        </Badge>
      </div>

      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{label}: </span>
                      <span className="font-mono font-bold text-[#F97316]">
                        {formatCurrency(Number(payload[0]?.value || 0))}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total === maxTotal && maxTotal > 0 ? '#F97316' : '#10B981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
