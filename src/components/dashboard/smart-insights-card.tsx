'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

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
    <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-3.5 rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Smart Financial Insights
          </h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200 dark:border-slate-800">
          ANALYTICS
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((ins, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200 font-medium"
          >
            {ins.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {ins.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
            {ins.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
            <span>{ins.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
