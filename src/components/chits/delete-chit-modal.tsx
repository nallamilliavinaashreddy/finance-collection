'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Chit } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface DeleteChitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  chit: Chit | null;
  isLoading?: boolean;
}

export function DeleteChitModal({
  isOpen,
  onClose,
  onConfirm,
  chit,
  isLoading = false,
}: DeleteChitModalProps) {
  if (!chit) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Chit Subscription" maxWidth="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Confirm Chit Subscription Deletion
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Are you sure you want to permanently delete {chit.chitCompany} ({chit.groupNumber})? This will also remove all associated payment ledger history.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Chit Company:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{chit.chitCompany}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Group Number:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{chit.groupNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Chit Value:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(chit.chitValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Paid So Far:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(chit.totalPaid)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete Chit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
