'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFinancialStatements, ProfitAndLossStatementData } from '@/lib/actions/accounting';
import { AccountingBookFrame } from '@/components/accounting/accounting-book-frame';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function ProfitLossPage() {
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [pnlData, setPnlData] = useState<ProfitAndLossStatementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const loadData = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    try {
      const bundle = await getFinancialStatements(targetDate);
      setPnlData(bundle.profitAndLoss);
    } catch (err: any) {
      showToast('Failed to compute Profit & Loss statement from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(asOfDate);
  }, [asOfDate, loadData]);

  const incomeAccounts = pnlData?.incomeAccounts || [];
  const expenseAccounts = pnlData?.expenseAccounts || [];
  const totalIncome = pnlData?.totalIncome || 0;
  const totalExpenses = pnlData?.totalExpenses || 0;
  const netProfitOrLoss = pnlData?.netProfitOrLoss || 0;
  const isNetProfit = pnlData?.isNetProfit ?? true;

  return (
    <AccountingBookFrame
      title="Profit & Loss Statement (లాభనష్టాల వివరము)"
      subtitle="Comprehensive Profit & Loss statement showing total interest earnings, fee incomes, operational expenses, and net profit distribution."
      asOfDate={asOfDate}
      onDateChange={(d) => setAsOfDate(d)}
      onRefresh={() => loadData(asOfDate)}
      isBalanced={true}
      isLoading={isLoading}
    >
      <div className="flex flex-col gap-6">
        {/* Net Profit Summary Headline Card */}
        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isNetProfit
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${
              isNetProfit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {isNetProfit ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs font-serif uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400">
                {isNetProfit ? 'NET ACCUMULATED PROFIT (నికర లాభము)' : 'NET ACCUMULATED LOSS (నికర నష్టము)'}
              </div>
              <div className="text-3xl font-bold font-serif mt-0.5">
                {formatCurrency(Math.abs(netProfitOrLoss))}
              </div>
            </div>
          </div>
          <Badge variant={isNetProfit ? 'success' : 'error'} className="text-xs py-1 px-3 self-start sm:self-auto">
            {isNetProfit ? 'Profitable Operations' : 'Net Loss Recorded'}
          </Badge>
        </div>

        {/* Traditional Accounting Statement Sheet */}
        <div className="overflow-x-auto rounded-xl border border-amber-900/20 dark:border-slate-800 bg-white dark:bg-[#131D31]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-100/80 dark:bg-slate-800/90 text-slate-900 dark:text-[#F8FAFC] border-b-2 border-amber-900/30 dark:border-slate-700">
                <th colSpan={2} className="py-3.5 px-4 font-serif font-bold text-sm tracking-wider text-amber-900 dark:text-amber-400 uppercase">
                  PARTICULARS / ఆదాయాలు & ఖర్చులు (ACCOUNT STATEMENT)
                </th>
                <th className="py-3.5 px-4 text-right font-serif font-bold text-sm tracking-wider text-amber-900 dark:text-amber-400 w-44 uppercase">
                  AMOUNT (రూ.)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-900/10 dark:divide-slate-800 text-xs font-serif">
              {/* SECTION 1: INCOME / REVENUE ACCOUNTS */}
              <tr className="bg-emerald-500/10 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-300">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wider">
                  I. INCOME & REVENUES (ఆదాయములు)
                </td>
              </tr>
              {incomeAccounts.map((inc) => (
                <tr key={inc.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40">
                  <td colSpan={2} className="py-3 px-6">
                    <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{inc.accountName}</div>
                    {inc.note && <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">{inc.note}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(inc.totalAmount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/60 dark:bg-slate-900/80 font-bold border-t border-b border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
                <td colSpan={2} className="py-3 px-6 uppercase text-xs">TOTAL INCOME (మొత్తం ఆదాయం)</td>
                <td className="py-3 px-4 text-right text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(totalIncome)}
                </td>
              </tr>

              {/* SECTION 2: EXPENSES & COSTS */}
              <tr className="bg-rose-500/10 dark:bg-rose-950/40 font-bold text-rose-900 dark:text-rose-300">
                <td colSpan={3} className="py-2.5 px-4 uppercase text-[11px] tracking-wider">
                  II. OPERATIONAL EXPENSES & INTEREST COSTS (ఖర్చులు)
                </td>
              </tr>
              {expenseAccounts.map((exp) => (
                <tr key={exp.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40">
                  <td colSpan={2} className="py-3 px-6">
                    <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{exp.accountName}</div>
                    {exp.note && <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">{exp.note}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(exp.totalAmount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-rose-50/60 dark:bg-slate-900/80 font-bold border-t border-b border-rose-500/30 text-rose-950 dark:text-rose-200">
                <td colSpan={2} className="py-3 px-6 uppercase text-xs">TOTAL EXPENSES (మొత్తం ఖర్చులు)</td>
                <td className="py-3 px-4 text-right text-sm text-rose-600 dark:text-rose-400 font-bold">
                  {formatCurrency(totalExpenses)}
                </td>
              </tr>
            </tbody>

            {/* Bottom Statement Double-Underline Net Profit Total Row */}
            <tfoot>
              <tr className="bg-amber-100/90 dark:bg-slate-800 text-slate-900 dark:text-[#F8FAFC] font-bold text-base border-t-2 border-b-4 border-double border-amber-900/40 dark:border-amber-400/40">
                <td colSpan={2} className="py-4 px-6 font-serif uppercase">
                  NET PROFIT / LOSS (నికర లాభము / నష్టము)
                </td>
                <td className={`py-4 px-4 text-right font-serif font-bold ${
                  isNetProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {formatCurrency(netProfitOrLoss)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Informational Flow Note */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-950 dark:text-emerald-200">
          <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Accounting Integration Notice:</span> Net Profit ({formatCurrency(netProfitOrLoss)}) calculated here flows automatically into Retained Earnings under Owner's Capital on the **Balance Sheet**.
          </div>
        </div>
      </div>
    </AccountingBookFrame>
  );
}
