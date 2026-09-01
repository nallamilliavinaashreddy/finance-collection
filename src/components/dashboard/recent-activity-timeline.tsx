'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collection, Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Landmark, Clock, ArrowUpRight } from 'lucide-react';

interface RecentActivityTimelineProps {
  collections?: Collection[];
  activeLoans?: Loan[];
}

export function RecentActivityTimeline({
  collections = [],
  activeLoans = [],
}: RecentActivityTimelineProps) {
  // Combine recent collections & recent loans into unified chronological activity feed
  const activityItems = React.useMemo(() => {
    const collItems = collections.slice(0, 5).map((c) => ({
      id: `coll-${c.id}`,
      type: 'collection' as const,
      title: `Collection Paid by ${c.customerName}`,
      subtitle: `Customer ID: ${c.customerCode}`,
      amount: c.amountPaid,
      date: c.paymentDate,
      timeAgo: 'Collection Recorded',
    }));

    const loanItems = activeLoans.slice(0, 5).map((l) => ({
      id: `loan-${l.id}`,
      type: 'loan' as const,
      title: `${(l.loanType || 'Daily').toUpperCase()} Loan Disbursed to ${l.customerName}`,
      subtitle: `Customer ID: ${l.customerCode}`,
      amount: l.amountGiven,
      date: l.startDate,
      timeAgo: 'Loan Active',
    }));

    return [...collItems, ...loanItems]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 6);
  }, [collections, activeLoans]);

  return (
    <Card className="p-6 glass-panel shadow-xl flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-[#262626]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Activity Feed
          </h3>
        </div>
        <Badge variant="info" className="font-mono text-[10px]">
          REAL-TIME STREAM
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        {activityItems.length > 0 ? (
          activityItems.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 flex items-center justify-between hover:border-slate-300 dark:hover:border-[#FF7A00]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    act.type === 'collection'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-[#FF7A00]/15 text-[#FF7A00]'
                  }`}
                >
                  {act.type === 'collection' ? <Receipt className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {act.subtitle} • {formatDate(act.date)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-xs font-black font-mono ${
                    act.type === 'collection' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#FF7A00]'
                  }`}
                >
                  {formatCurrency(act.amount)}
                </span>
                <span className="text-[9px] font-mono text-slate-400">{act.timeAgo}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No recent activity recorded.</p>
        )}
      </div>
    </Card>
  );
}
