'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFinancialStatements, BalanceSheetStatementData } from '@/lib/actions/accounting';
import { AccountingBookFrame } from '@/components/accounting/accounting-book-frame';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ManualBalanceSheetEntry } from '@/types';
import { ManualEntryModal } from '@/components/balance-sheet/manual-entry-modal';
import { DeleteManualEntryModal } from '@/components/balance-sheet/delete-manual-entry-modal';
import {
  Plus,
  Pencil,
  Trash2,
  Scale,
  Layers,
  Info,
} from 'lucide-react';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bsData, setBsData] = useState<BalanceSheetStatementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Entry Modal states
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ManualBalanceSheetEntry | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ManualBalanceSheetEntry | null>(null);

  const { showToast } = useToast();

  const loadData = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    try {
      const bundle = await getFinancialStatements(targetDate);
      setBsData(bundle.balanceSheet);
    } catch (err: any) {
      showToast('Failed to compute Balance Sheet from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(asOfDate);
  }, [asOfDate, loadData]);

  const liabilitiesAndCapital = bsData?.liabilitiesAndCapital;
  const assets = bsData?.assets;
  const summary = bsData?.summary;
  const manualEntries = bsData?.manualEntries || [];

  const capitalAccounts = liabilitiesAndCapital?.capitalAccounts || [];
  const liabilityAccounts = liabilitiesAndCapital?.liabilityAccounts || [];
  const assetAccounts = assets?.assetAccounts || [];

  const retainedNetProfit = liabilitiesAndCapital?.retainedNetProfit || 0;
  const totalLiabilitiesAndCapital = summary?.totalLiabilitiesAndCapital || 0;
  const totalAssets = summary?.totalAssets || 0;
  const isBalanced = summary?.isBalanced ?? true;
  const difference = summary?.difference || 0;

  // Flatten Left Side: Capital Accounts + Retained Profit + Liabilities
  const leftSideItems = [
    ...capitalAccounts,
    {
      id: 'ret-profit-1',
      accountName: 'Retained Earnings / Accumulated Net Profit (లాభము)',
      category: 'Capital' as const,
      systemAmount: retainedNetProfit,
      manualAmount: 0,
      totalAmount: retainedNetProfit,
      note: 'Accumulated net profit generated from Profit & Loss statement',
    },
    ...liabilityAccounts,
  ];

  // Right Side: Assets
  const rightSideItems = [...assetAccounts];

  // Align rows by max length so both sides match line-by-line like Image 3
  const maxRows = Math.max(leftSideItems.length, rightSideItems.length);
  const rowsArray = Array.from({ length: maxRows });

  // Columns for Manual Entries List Table
  const manualEntriesColumns: ColumnDef<ManualBalanceSheetEntry>[] = [
    {
      accessorKey: 'entryDate',
      header: 'Entry Date',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
          {formatDate(row.original.entryDate)}
        </span>
      ),
    },
    {
      accessorKey: 'entryType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.entryType;
        let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
        if (type === 'Asset') variant = 'success';
        if (type === 'Liability') variant = 'error';
        if (type === 'Owner Capital') variant = 'warning';

        return (
          <Badge variant={variant} className="font-mono text-[10px]">
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="font-bold text-xs text-slate-900 dark:text-white">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description / Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount (₹)',
      cell: ({ row }) => (
        <span className="font-black text-sm font-mono text-amber-600 dark:text-amber-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => (
        <span className="text-[11px] text-slate-500 font-medium">
          {row.original.createdBy || 'Admin'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEntryToEdit(row.original);
              setIsManualModalOpen(true);
            }}
            className="h-7 w-7 p-0 rounded-lg hover:bg-amber-500/10 text-amber-600"
            title="Edit Manual Entry"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEntryToDelete(row.original);
              setIsDeleteModalOpen(true);
            }}
            className="h-7 w-7 p-0 rounded-lg hover:bg-rose-500/10 text-rose-600"
            title="Delete Entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AccountingBookFrame
      title="Balance Sheet (ఆస్తి అప్పుల పట్టిక)"
      subtitle="Traditional two-sided General Balance Sheet statement. Total Liabilities & Capital must equal Total Assets."
      asOfDate={asOfDate}
      onDateChange={(d) => setAsOfDate(d)}
      onRefresh={() => loadData(asOfDate)}
      isBalanced={isBalanced}
      difference={difference}
      isLoading={isLoading}
      actions={
        <Button
          onClick={() => {
            setEntryToEdit(null);
            setIsManualModalOpen(true);
          }}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 shrink-0"
        >
          Add Manual Entry
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {/* TRADITIONAL TWO-COLUMN BALANCE SHEET SHEET TABLE (MATCHING REFERENCE IMAGE 3) */}
        <div className="overflow-x-auto rounded-xl border border-amber-900/20 dark:border-slate-800 bg-white dark:bg-[#131D31]">
          <table className="w-full text-left border-collapse">
            {/* Header Bands */}
            <thead>
              <tr className="bg-amber-100/80 dark:bg-slate-800/90 text-slate-900 dark:text-[#F8FAFC] border-b-2 border-amber-900/30 dark:border-slate-700">
                <th colSpan={2} className="py-3.5 px-4 font-serif font-bold text-sm tracking-wider text-rose-900 dark:text-rose-400 border-r border-amber-900/20 dark:border-slate-700 uppercase">
                  LIABILITIES & CAPITAL / అప్పులు & పెట్టుబడి (LEFT SIDE)
                </th>
                <th colSpan={2} className="py-3.5 px-4 font-serif font-bold text-sm tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
                  ASSETS / ఆస్తులు (RIGHT SIDE)
                </th>
              </tr>
              <tr className="bg-amber-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-amber-900/20 dark:border-slate-700">
                <th className="py-2.5 px-4 border-r border-amber-900/10 dark:border-slate-800">Particulars (ఖాతా వివరములు)</th>
                <th className="py-2.5 px-4 text-right border-r border-amber-900/30 dark:border-slate-700 w-36">Amount (రూ.)</th>
                <th className="py-2.5 px-4 border-r border-amber-900/10 dark:border-slate-800">Particulars (ఖాతా వివరములు)</th>
                <th className="py-2.5 px-4 text-right w-36">Amount (రూ.)</th>
              </tr>
            </thead>

            {/* Account Rows */}
            <tbody className="divide-y divide-amber-900/10 dark:divide-slate-800 text-xs font-serif">
              {rowsArray.map((_, idx) => {
                const leftItem = leftSideItems[idx];
                const rightItem = rightSideItems[idx];

                return (
                  <tr key={`bs-row-${idx}`} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Left Side Particulars */}
                    <td className="py-3.5 px-4 border-r border-amber-900/10 dark:border-slate-800">
                      {leftItem ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {leftItem.accountName}
                          </span>
                          {leftItem.note && (
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                              {leftItem.note}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 font-sans">-</span>
                      )}
                    </td>

                    {/* Left Side Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700 dark:text-rose-400 border-r border-amber-900/30 dark:border-slate-700">
                      {leftItem ? (
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(leftItem.totalAmount)}</span>
                          {leftItem.manualAmount !== 0 && (
                            <span className="text-[9px] font-sans text-amber-600 font-semibold">
                              (Inc {leftItem.manualAmount > 0 ? '+' : ''}{formatCurrency(leftItem.manualAmount)} manual)
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Right Side Particulars */}
                    <td className="py-3.5 px-4 border-r border-amber-900/10 dark:border-slate-800">
                      {rightItem ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {rightItem.accountName}
                          </span>
                          {rightItem.note && (
                            <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                              {rightItem.note}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 font-sans">-</span>
                      )}
                    </td>

                    {/* Right Side Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {rightItem ? (
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(rightItem.totalAmount)}</span>
                          {rightItem.manualAmount !== 0 && (
                            <span className="text-[9px] font-sans text-amber-600 font-semibold">
                              (Inc {rightItem.manualAmount > 0 ? '+' : ''}{formatCurrency(rightItem.manualAmount)} manual)
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Ledger Totals with Accounting Double-Underline */}
            <tfoot>
              <tr className="bg-amber-100/90 dark:bg-slate-800 text-slate-900 dark:text-[#F8FAFC] font-bold text-sm border-t-2 border-b-4 border-double border-amber-900/40 dark:border-amber-400/40">
                <td className="py-3.5 px-4 font-serif border-r border-amber-900/10 dark:border-slate-800">
                  TOTAL LIABILITIES & CAPITAL (మొత్తం అప్పులు)
                </td>
                <td className="py-3.5 px-4 text-right font-serif text-amber-900 dark:text-amber-300 border-r-2 border-amber-900/40 dark:border-slate-700">
                  {formatCurrency(totalLiabilitiesAndCapital)}
                </td>
                <td className="py-3.5 px-4 font-serif border-r border-amber-900/10 dark:border-slate-800">
                  TOTAL ASSETS (మొత్తం ఆస్తులు)
                </td>
                <td className="py-3.5 px-4 text-right font-serif text-amber-900 dark:text-amber-300">
                  {formatCurrency(totalAssets)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Informational Accounting Rule Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Accounting Rule Verification:</span> Total Liabilities & Capital ({formatCurrency(totalLiabilitiesAndCapital)}) must equal Total Assets ({formatCurrency(totalAssets)}). This statement automatically incorporates system-calculated balances alongside any manual adjustments saved below.
          </div>
        </div>

        {/* MANUAL ENTRIES & ADJUSTMENTS TABLE */}
        <div className="flex flex-col gap-4 pt-4 border-t border-amber-900/10 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Saved Manual Accounting Entries & Adjustments
              <Badge variant="warning" className="font-mono text-xs">
                {manualEntries.length} Saved Entries
              </Badge>
            </h3>
            <Button
              onClick={() => {
                setEntryToEdit(null);
                setIsManualModalOpen(true);
              }}
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              Add Entry
            </Button>
          </div>

          <div className="rounded-xl border border-amber-900/20 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#131D31]">
            <DataTable
              columns={manualEntriesColumns}
              data={manualEntries}
              emptyText={isLoading ? 'Loading manual entries...' : 'No manual balance sheet adjustments recorded yet.'}
              pageSize={5}
            />
          </div>
        </div>

        {/* Modals */}
        <ManualEntryModal
          isOpen={isManualModalOpen}
          onClose={() => {
            setIsManualModalOpen(false);
            setEntryToEdit(null);
          }}
          onSuccess={() => loadData(asOfDate)}
          entryToEdit={entryToEdit}
        />

        <DeleteManualEntryModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setEntryToDelete(null);
          }}
          onSuccess={() => loadData(asOfDate)}
          entry={entryToDelete}
        />
      </div>
    </AccountingBookFrame>
  );
}
