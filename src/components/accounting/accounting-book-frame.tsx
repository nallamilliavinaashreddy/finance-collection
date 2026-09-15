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
    <div className="flex flex-col gap-5 pb-10">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {isBalanced ? (
              <Badge variant="outline" className="gap-1 py-0.5 px-2 text-[11px] font-semibold text-emerald-600 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 py-0.5 px-2 text-[11px] font-semibold text-rose-600 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Imbalance: {formatCurrency(difference)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        {/* Statement Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statement Quick Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Link
              href="/trial-balance"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === '/trial-balance'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Trial Balance
            </Link>
            <Link
              href="/profit-loss"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === '/profit-loss'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Profit & Loss
            </Link>
            <Link
              href="/balance-sheet"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === '/balance-sheet'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Balance Sheet
            </Link>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3 border-slate-200 dark:border-slate-800 hidden sm:flex"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
          </Button>

          {actions}
        </div>
      </div>

      {/* Accounting Book Document Container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Book Title Banner */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Official Accounting Book Statement
            </span>
            <h1 className="text-lg font-bold tracking-tight mt-0.5">{title}</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">FINANCIAL PERIOD</span>
            <span className="text-xs font-semibold text-slate-200">As of {formatDate(asOfDate)}</span>
          </div>
        </div>

        {/* Statement Content */}
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
