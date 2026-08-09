'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  customer: Customer | null;
  isLoading?: boolean;
}

export function DeleteCustomerModal({
  isOpen,
  onClose,
  onConfirm,
  customer,
  isLoading = false,
}: DeleteCustomerModalProps) {
  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Customer Deletion"
      description="This action will permanently delete the customer record."
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            Are you sure you want to delete <span className="font-bold">{customer.customerName}</span> (ID:{' '}
            <span className="font-mono font-bold">{customer.customerId}</span>)?
            <br />
            This record cannot be recovered once removed.
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
            Delete Customer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
