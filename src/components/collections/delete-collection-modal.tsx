'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Collection } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  collection: Collection | null;
  isLoading?: boolean;
}

export function DeleteCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  collection,
  isLoading = false,
}: DeleteCollectionModalProps) {
  if (!collection) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Collection Deletion"
      description="Deleting this collection record will automatically revert the loan's collected amount and balance."
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            Are you sure you want to delete Collection entry for{' '}
            <span className="font-bold">{collection.customerName}</span> (ID: <span className="font-mono font-bold">{collection.customerCode}</span>)?
            <br />
            Amount: <span className="font-semibold">{formatCurrency(collection.amountPaid)}</span> collected on{' '}
            <span className="font-semibold">{formatDate(collection.paymentDate)}</span>.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
