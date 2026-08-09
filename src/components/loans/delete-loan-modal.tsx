'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Loan } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loan: Loan | null;
  isLoading?: boolean;
}

export function DeleteLoanModal({
  isOpen,
  onClose,
  onConfirm,
  loan,
  isLoading = false,
}: DeleteLoanModalProps) {
  if (!loan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Loan Deletion"
      description="This action will permanently delete the loan record from Supabase."
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            Are you sure you want to delete Loan record for customer{' '}
            <span className="font-bold">{loan.customerName}</span> (ID: <span className="font-mono font-bold">{loan.customerCode}</span>)?
            <br />
            Disbursed Amount: <span className="font-semibold">{formatCurrency(loan.amountGiven)}</span>. Total Target:{' '}
            <span className="font-semibold">{formatCurrency(loan.totalCollectionAmount)}</span>.
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
            Delete Loan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
