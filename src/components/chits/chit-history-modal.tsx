'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Chit, ChitPayment } from '@/types';
import { getChitPayments, deleteChitPayment } from '@/lib/actions/chits';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Coins, Receipt, RefreshCw, Trash2 } from 'lucide-react';

interface ChitHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chit: Chit | null;
}

export function ChitHistoryModal({
  isOpen,
  onClose,
  chit,
}: ChitHistoryModalProps) {
  const [payments, setPayments] = useState<ChitPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = React.useCallback(async () => {
    if (!chit) return;
    setIsLoading(true);
    try {
      const res = await getChitPayments(chit.id);
      if (res.success && res.data) {
        setPayments(res.data);
      }
    } catch (e) {
      console.error('Error fetching chit payment history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [chit]);

  useEffect(() => {
    if (isOpen && chit) {
      fetchHistory();
    }
  }, [isOpen, chit, fetchHistory]);

  if (!chit) return null;

  const columns: ColumnDef<ChitPayment>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.paymentDate)}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount Paid',
      cell: ({ row }) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.paymentMode}
        </Badge>
      ),
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt / UTR',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.receiptNumber || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[150px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          title="Delete Payment"
          onClick={async () => {
            if (confirm(`Delete payment of ${formatCurrency(row.original.amount)}?`)) {
              const res = await deleteChitPayment(row.original.id);
              if (res.success) {
                fetchHistory();
              }
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chit Payment History Ledger"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Chit Header Card */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-base text-white">{chit.chitCompany}</h4>
              <Badge variant="info" className="font-mono text-xs">
                {chit.groupNumber}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              isLoading={isLoading}
              className="h-7 text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400">Total Invested:</span>
              <p className="font-bold text-[#FF7A00] mt-0.5">{formatCurrency(chit.totalInvestment ?? chit.totalPaid)}</p>
            </div>
            <div>
              <span className="text-slate-400">Total Received:</span>
              <p className="font-bold text-emerald-400 mt-0.5">{formatCurrency(chit.totalReceived ?? chit.prizeAmount)}</p>
            </div>
            <div>
              <span className="text-slate-400">Principal Recovered:</span>
              <p className="font-bold text-slate-200 mt-0.5">{formatCurrency(chit.principalRecovered ?? Math.min(chit.totalPaid, chit.prizeAmount))}</p>
            </div>
            <div>
              <span className="text-slate-400">Net Profit / Loss:</span>
              <p className={`font-black mt-0.5 ${(chit.netResult ?? 0) > 0 ? 'text-emerald-400' : (chit.netResult ?? 0) < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {formatCurrency(chit.netResult ?? 0)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Result Status:</span>
              <div className="mt-0.5">
                <Badge
                  variant={
                    chit.resultStatus === 'profit' || (chit.netResult ?? 0) > 0
                      ? 'success'
                      : chit.resultStatus === 'loss' || (chit.netResult ?? 0) < 0
                      ? 'error'
                      : 'outline'
                  }
                  className="uppercase text-[10px]"
                >
                  {(chit.netResult ?? 0) > 0 ? 'PROFIT' : (chit.netResult ?? 0) < 0 ? 'LOSS' : 'BREAK EVEN'}
                </Badge>
              </div>
            </div>
          </div>
          {(chit.status === 'completed' || chit.status === 'closed') && (
            <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/80">
              <span>Accounting Ledger Sync:</span>
              <span className="font-mono text-emerald-400 font-medium">
                {(chit.netResult ?? 0) > 0
                  ? `Posted ₹${(chit.netResult ?? 0)} to Central Cash Flow as "Chit Profit"`
                  : (chit.netResult ?? 0) < 0
                  ? `Posted ₹${Math.abs(chit.netResult ?? 0)} to Central Cash Flow as "Chit Loss"`
                  : 'Break Even (No P/L entry required)'}
              </span>
            </div>
          )}
        </div>

        {/* Payments Data Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-2 bg-white dark:bg-slate-900">
          <DataTable
            columns={columns}
            data={payments}
            emptyText={isLoading ? 'Loading payment records...' : 'No installment payments recorded yet.'}
            pageSize={5}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

