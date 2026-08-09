'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface DeleteStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  stamp: Stamp | null;
  isLoading?: boolean;
}

export function DeleteStampModal({
  isOpen,
  onClose,
  onConfirm,
  stamp,
  isLoading = false,
}: DeleteStampModalProps) {
  if (!stamp) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Stamp Record" maxWidth="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Confirm Stamp Deletion
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Are you sure you want to permanently delete this stamp record for {stamp.customerName}? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {stamp.customerName} ({stamp.customerCode})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Stamp Type:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {stamp.stampType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Stamp Date:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(stamp.stampDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(stamp.amount)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete Stamp
          </Button>
        </div>
      </div>
    </Modal>
  );
}
