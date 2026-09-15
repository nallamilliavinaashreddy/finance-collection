'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getFinancialStatements, TrialBalanceData } from '@/lib/actions/accounting';
import { AccountingBookFrame } from '@/components/accounting/accounting-book-frame';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { Scale, Info } from 'lucide-react';

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [tbData, setTbData] = useState<TrialBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const loadData = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    try {
      const bundle = await getFinancialStatements(targetDate);
      setTbData(bundle.trialBalance);
    } catch (err: any) {
      showToast('Failed to compute Trial Balance from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(asOfDate);
  }, [asOfDate, loadData]);

  const debitAccounts = tbData?.debitAccounts || [];
  const creditAccounts = tbData?.creditAccounts || [];
  const totalDebit = tbData?.totalDebit || 0;
  const totalCredit = tbData?.totalCredit || 0;
  const isBalanced = tbData?.isBalanced ?? true;
  const difference = tbData?.difference || 0;

  // Align rows by max length so both sides match line-by-line like a traditional accounting ledger sheet
  const maxRows = Math.max(debitAccounts.length, creditAccounts.length);
  const rowsArray = Array.from({ length: maxRows });

  return (
    <AccountingBookFrame
      title="Trial Balance (నామమాత్రపు ఖాతాల వివరము)"
      subtitle="Account-wise summary of all Debit and Credit balances. Total Debit must equal Total Credit."
      asOfDate={asOfDate}
      onDateChange={(d) => setAsOfDate(d)}
      onRefresh={() => loadData(asOfDate)}
      isBalanced={isBalanced}
      difference={difference}
      isLoading={isLoading}
    >
      {/* Trial Balance Main Two-Side Ledger Sheet Table */}
      <div className="flex flex-col gap-6">
        <div className="overflow-x-auto rounded-xl border border-amber-900/20 dark:border-slate-800 bg-white dark:bg-[#131D31]">
          <table className="w-full text-left border-collapse">
            {/* Header Bands */}
            <thead>
              <tr className="bg-amber-100/80 dark:bg-slate-800/90 text-slate-900 dark:text-[#F8FAFC] border-b-2 border-amber-900/30 dark:border-slate-700">
                <th colSpan={2} className="py-3.5 px-4 font-serif font-bold text-sm tracking-wider text-amber-900 dark:text-amber-400 border-r border-amber-900/20 dark:border-slate-700 uppercase">
                  DEBIT ACCOUNTS / వసూళ్లు & ఆస్తులు (LEFT SIDE)
                </th>
                <th colSpan={2} className="py-3.5 px-4 font-serif font-bold text-sm tracking-wider text-[#3B82F6] dark:text-[#60A5FA] uppercase">
                  CREDIT ACCOUNTS / చెల్లింపులు & అప్పులు (RIGHT SIDE)
                </th>
              </tr>
              <tr className="bg-amber-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-amber-900/20 dark:border-slate-700">
                <th className="py-2.5 px-4 border-r border-amber-900/10 dark:border-slate-800">Particulars (ఖాతా వివరములు)</th>
                <th className="py-2.5 px-4 text-right border-r border-amber-900/30 dark:border-slate-700 w-36">Debit (రూ.)</th>
                <th className="py-2.5 px-4 border-r border-amber-900/10 dark:border-slate-800">Particulars (ఖాతా వివరములు)</th>
                <th className="py-2.5 px-4 text-right w-36">Credit (రూ.)</th>
              </tr>
            </thead>

            {/* Account Rows */}
            <tbody className="divide-y divide-amber-900/10 dark:divide-slate-800 text-xs font-serif">
              {rowsArray.map((_, idx) => {
                const debitItem = debitAccounts[idx];
                const creditItem = creditAccounts[idx];

                return (
                  <tr key={`tb-row-${idx}`} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Debit Particulars */}
                    <td className="py-3 px-4 border-r border-amber-900/10 dark:border-slate-800">
                      {debitItem ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {debitItem.accountName}
                          </span>
                          {debitItem.note && (
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                              {debitItem.note}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 font-sans">-</span>
                      )}
                    </td>

                    {/* Debit Amount */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-[#F8FAFC] border-r border-amber-900/30 dark:border-slate-700">
                      {debitItem ? formatCurrency(debitItem.totalAmount) : '-'}
                    </td>

                    {/* Credit Particulars */}
                    <td className="py-3 px-4 border-r border-amber-900/10 dark:border-slate-800">
                      {creditItem ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {creditItem.accountName}
                          </span>
                          {creditItem.note && (
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                              {creditItem.note}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 font-sans">-</span>
                      )}
                    </td>

                    {/* Credit Amount */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {creditItem ? formatCurrency(creditItem.totalAmount) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Ledger Totals with Accounting Double-Underline */}
            <tfoot>
              <tr className="bg-amber-100/90 dark:bg-slate-800 text-slate-900 dark:text-[#F8FAFC] font-bold text-sm border-t-2 border-b-4 border-double border-amber-900/40 dark:border-amber-400/40">
                <td className="py-3.5 px-4 font-serif border-r border-amber-900/10 dark:border-slate-800">
                  TOTAL DEBIT (మొత్తం డెబిట్)
                </td>
                <td className="py-3.5 px-4 text-right font-serif text-amber-900 dark:text-amber-300 border-r-2 border-amber-900/40 dark:border-slate-700">
                  {formatCurrency(totalDebit)}
                </td>
                <td className="py-3.5 px-4 font-serif border-r border-amber-900/10 dark:border-slate-800">
                  TOTAL CREDIT (మొత్తం క్రెడిట్)
                </td>
                <td className="py-3.5 px-4 text-right font-serif text-amber-900 dark:text-amber-300">
                  {formatCurrency(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Informational Footer Note */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Double-Entry Verification Rule:</span> In FinCollect, Total Debit represents all deployed financial assets & operational expenses, while Total Credit represents owner capital, liabilities, and accrued revenues. When both totals match, the double-entry accounting ledger is 100% verified.
          </div>
        </div>
      </div>
    </AccountingBookFrame>
  );
}
