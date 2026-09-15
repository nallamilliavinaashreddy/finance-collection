'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Calendar,
  Scale,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

interface AccountingBookFrameProps {
  title: string;
  subtitle: string;
  asOfDate: string;
  onDateChange: (newDate: string) => void;
  onRefresh: () => void;
  isBalanced?: boolean;
  difference?: number;
  isLoading?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AccountingBookFrame({
  title,
  subtitle,
  asOfDate,
  onDateChange,
  onRefresh,
  isBalanced = true,
  difference = 0,
  isLoading = false,
  children,
  actions,
}: AccountingBookFrameProps) {
  const pathname = usePathname();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              {title}
            </h2>
            {isBalanced ? (
              <Badge variant="success" className="gap-1.5 py-1 px-2.5 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Books Balanced
              </Badge>
            ) : (
              <Badge variant="error" className="gap-1.5 py-1 px-2.5 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Imbalance: {formatCurrency(difference)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">{subtitle}</p>
        </div>

        {/* Statement Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statement Quick Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-[#182237] p-1 rounded-xl border border-slate-200 dark:border-[#26344D]">
            <Link
              href="/trial-balance"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                pathname === '/trial-balance'
                  ? 'bg-white dark:bg-[#26344D] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              Trial Balance
            </Link>
            <Link
              href="/profit-loss"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                pathname === '/profit-loss'
                  ? 'bg-white dark:bg-[#26344D] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Profit & Loss
            </Link>
            <Link
              href="/balance-sheet"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                pathname === '/balance-sheet'
                  ? 'bg-white dark:bg-[#26344D] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Balance Sheet
            </Link>
          </div>

          {/* Date Picker */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3 text-slate-400 dark:text-[#94A3B8] pointer-events-none" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-10 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#26344D] bg-white dark:bg-[#1B2638] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <Button variant="outline" size="md" onClick={onRefresh} className="px-3" title="Refresh Accounting Engine">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : 'text-slate-500 dark:text-[#94A3B8]'}`} />
          </Button>

          <Button variant="outline" size="md" onClick={handlePrint} className="px-3 hidden sm:flex" title="Print Statement">
            <Printer className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
          </Button>

          {actions}
        </div>
      </div>

      {/* Traditional Accounting Ledger Book Canvas */}
      <div className="relative rounded-2xl border border-amber-900/20 dark:border-amber-500/20 bg-[#FFFDF9] dark:bg-[#0F172A] shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Top Ledger Paper Date Header Ribbon */}
        <div className="bg-amber-100/70 dark:bg-[#1E293B] border-b border-amber-200 dark:border-[#334155] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-serif font-bold text-lg shadow-inner">
              ₹
            </div>
            <div>
              <div className="text-xs font-serif uppercase tracking-widest text-amber-900 dark:text-amber-400 font-bold">
                FINCOLLECT ACCOUNTING LEDGER BOOK
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">
                {title} • <span className="text-amber-700 dark:text-amber-400 font-serif">{formatDate(asOfDate)}</span>
              </div>
            </div>
          </div>

          {/* Book Balances Indicator */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-slate-800 font-mono">
              <span className="text-slate-500 dark:text-slate-400">STATUS:</span>
              <span className={`font-bold ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isBalanced ? 'EQUAL BALANCED' : 'UNBALANCED'}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Content Area */}
        <div className="p-6 md:p-8">
          {children}
        </div>

        {/* Bottom Ledger Footer */}
        <div className="border-t border-amber-200/60 dark:border-slate-800 px-6 py-3 bg-amber-50/40 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div>FinCollect Double-Entry General Ledger Engine</div>
          <div>Derived from Live Supabase Transaction Logs</div>
        </div>
      </div>
    </div>
  );
}
