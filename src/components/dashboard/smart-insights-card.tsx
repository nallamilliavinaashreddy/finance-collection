'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, CheckCircle2, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';

interface SmartInsightsCardProps {
  todaysCollections?: number;
  todaysExpenses?: number;
  activeLoansCount?: number;
  remainingBalance?: number;
  netProfit?: number;
}

export function SmartInsightsCard({
  todaysCollections = 0,
  todaysExpenses = 0,
  activeLoansCount = 0,
  remainingBalance = 0,
  netProfit = 0,
}: SmartInsightsCardProps) {
  const insights = useMemo(() => {
    const list: { text: string; type: 'success' | 'info' | 'warning' }[] = [];

    if (todaysCollections > todaysExpenses) {
      list.push({
        text: `Today's collections (${formatCurrency(todaysCollections)}) exceed operating expenses by ${formatCurrency(todaysCollections - todaysExpenses)}.`,
        type: 'success',
      });
    } else if (todaysExpenses > 0) {
      list.push({
        text: `Operating expenses today are ${formatCurrency(todaysExpenses)}. Ensure collection entries are logged.`,
        type: 'warning',
      });
    } else {
      list.push({
        text: `Collections stream active. ${activeLoansCount} active loans are currently generating interest.`,
        type: 'info',
      });
    }

    if (netProfit >= 0) {
      list.push({
        text: `Business net profit position is positive (${formatCurrency(netProfit)} net gain).`,
        type: 'success',
      });
    } else {
      list.push({
        text: `Current net position reflects capital deployment (${formatCurrency(Math.abs(netProfit))}).`,
        type: 'warning',
      });
    }

    if (remainingBalance > 0) {
      list.push({
        text: `Total remaining customer loan balance is ${formatCurrency(remainingBalance)} across ${activeLoansCount} active loans.`,
        type: 'info',
      });
    }

    return list;
  }, [todaysCollections, todaysExpenses, activeLoansCount, remainingBalance, netProfit]);

  return (
    <Card className="p-6 glass-panel shadow-xl flex flex-col justify-between gap-4 border-[#FF7A00]/30 bg-gradient-to-br from-amber-500/10 via-white/80 to-white dark:via-[#111111]/90 dark:to-[#111111]/95">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Smart Financial Insights
          </h3>
        </div>
        <Badge variant="warning" className="font-mono text-[10px]">
          AI ENGINE
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5">
        {insights.map((ins, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
          >
            {ins.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
            {ins.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
            {ins.type === 'info' && <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
            <span>{ins.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
