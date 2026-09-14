'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ManualBalanceSheetEntry } from '@/types';
import { deleteManualBalanceSheetEntry } from '@/lib/actions/balance-sheet';
import { useToast } from '@/components/providers/toast-provider';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DeleteManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: ManualBalanceSheetEntry | null;
}

export function DeleteManualEntryModal({
  isOpen,
  onClose,
  onSuccess,
  entry,
}: DeleteManualEntryModalProps) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!entry) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteManualBalanceSheetEntry(entry.id);
      if (res.success) {
        showToast('Manual entry deleted successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to delete entry', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting manual entry', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Manual Entry"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs">
            Are you sure you want to delete this manual balance sheet entry? This action will remove the adjustment from all totals.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Category:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{entry.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="font-bold text-amber-600">{formatCurrency(entry.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Description:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{entry.description}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            isLoading={isDeleting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
