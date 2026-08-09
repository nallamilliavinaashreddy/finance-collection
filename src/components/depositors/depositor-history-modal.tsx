'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Depositor, DepositorLedger } from '@/types';
import { getDepositorLedger } from '@/lib/actions/depositors';
import { formatCurrency, formatDate } from '@/lib/utils';
import { History, RefreshCw, Landmark } from 'lucide-react';

interface DepositorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositor: Depositor | null;
}

export function DepositorHistoryModal({
  isOpen,
  onClose,
  depositor,
}: DepositorHistoryModalProps) {
  const [ledger, setLedger] = useState<DepositorLedger[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!depositor) return;
    setIsLoading(true);
    try {
      const res = await getDepositorLedger(depositor.id);
      if (res.success && res.data) {
        setLedger(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching depositor ledger:', err);
    } finally {
      setIsLoading(false);
    }
  }, [depositor]);

  useEffect(() => {
    if (isOpen && depositor) {
      fetchLedger();
    }
  }, [isOpen, depositor, fetchLedger]);

  if (!depositor) return null;

  const columns: ColumnDef<DepositorLedger>[] = [
    {
      accessorKey: 'transactionDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Action / Type',
      cell: ({ row }) => {
        const type = row.original.transactionType;
        let variant: 'success' | 'error' | 'info' | 'outline' | 'warning' = 'info';
        let labelDisplay: string = String(type);

        if (type === 'deposit_received') {
          variant = 'success';
          labelDisplay = 'Deposit Received (+)';
        } else if (type === 'interest_paid') {
          variant = 'warning';
          labelDisplay = 'Monthly Interest Paid (-)';
        } else if (type === 'partial_return') {
          variant = 'info';
          labelDisplay = 'Partial Principal Returned (-)';
        } else if (type === 'full_return') {
          variant = 'outline';
          labelDisplay = 'Full Principal Returned (-)';
        }

        return (
          <Badge variant={variant} className="text-[10px] capitalize">
            {labelDisplay}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Balance (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatCurrency(row.original.openingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'amountIn',
      header: 'Amount In (₹)',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {row.original.amountIn > 0 ? formatCurrency(row.original.amountIn) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amountOut',
      header: 'Amount Out (₹)',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {row.original.amountOut > 0 ? formatCurrency(row.original.amountOut) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'closingBalance',
      header: 'Outstanding Principal (₹)',
      cell: ({ row }) => (
        <span className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.closingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[200px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Depositor Ledger History - ${depositor.depositorName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Depositor Info Brief */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-amber-600" />
              {depositor.depositorName} {depositor.mobileNumber && `(${depositor.mobileNumber})`}
            </span>
            <Badge variant={depositor.status === 'active' ? 'success' : 'outline'} className="text-[10px]">
              {depositor.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
            <div>
              <span className="text-slate-500">Initial Deposit:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(depositor.depositAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Monthly Interest:</span>
              <p className="font-bold text-amber-600 dark:text-amber-400">{depositor.monthlyInterestRate}% / mo</p>
            </div>
            <div>
              <span className="text-slate-500">Outstanding Principal:</span>
              <p className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">{formatCurrency(depositor.outstandingPrincipal)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Interest Paid:</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(depositor.totalInterestPaid)}</p>
            </div>
          </div>
        </div>

        {/* Refresh & Title */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-amber-500" />
            Individual Depositor Ledger ({ledger.length} entries)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLedger}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3 h-3" />}
            className="h-7 text-xs"
          >
            Refresh
          </Button>
        </div>

        {/* Ledger Table */}
        <DataTable
          columns={columns}
          data={ledger}
          emptyText={isLoading ? 'Loading depositor ledger...' : 'No ledger history found for this depositor.'}
          pageSize={6}
        />

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

