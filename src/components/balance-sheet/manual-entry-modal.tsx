'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ManualBalanceSheetEntry,
  ManualBalanceSheetEntryType,
  ManualBalanceSheetCategory,
} from '@/types';
import {
  createManualBalanceSheetEntry,
  updateManualBalanceSheetEntry,
} from '@/lib/actions/balance-sheet';
import { useToast } from '@/components/providers/toast-provider';
import { Calendar, Tag, FileText, Layers } from 'lucide-react';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entryToEdit?: ManualBalanceSheetEntry | null;
}

const CATEGORY_MAP: Record<ManualBalanceSheetEntryType, ManualBalanceSheetCategory[]> = {
  Asset: ['Cash in Hand', 'Cash in Bank', 'Loans Receivable', 'Active Investment', 'Other Asset'],
  Liability: ['Deposits / Amount Payable', 'Other Payable'],
  'Owner Capital': ['Capital Added', 'Capital Withdrawn'],
  'Expense/Adjustment': ['Expense Adjustment'],
};

export function ManualEntryModal({
  isOpen,
  onClose,
  onSuccess,
  entryToEdit,
}: ManualEntryModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(entryToEdit);

  const defaultDate = new Date().toISOString().split('T')[0];

  const [entryType, setEntryType] = useState<ManualBalanceSheetEntryType>('Asset');
  const [category, setCategory] = useState<ManualBalanceSheetCategory>('Cash in Hand');
  const [amount, setAmount] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(defaultDate);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (entryToEdit) {
        setEntryType(entryToEdit.entryType);
        setCategory(entryToEdit.category);
        setAmount(String(entryToEdit.amount));
        setEntryDate(entryToEdit.entryDate);
        setDescription(entryToEdit.description || '');
      } else {
        setEntryType('Asset');
        setCategory('Cash in Hand');
        setAmount('');
        setEntryDate(defaultDate);
        setDescription('');
      }
    }
  }, [isOpen, entryToEdit, defaultDate]);

  const handleTypeChange = (type: ManualBalanceSheetEntryType) => {
    setEntryType(type);
    const availableCategories = CATEGORY_MAP[type];
    if (availableCategories && availableCategories.length > 0) {
      setCategory(availableCategories[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Please enter a description or remarks for this manual entry', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && entryToEdit) {
        const res = await updateManualBalanceSheetEntry(entryToEdit.id, {
          entryType,
          category,
          amount: numAmount,
          entryDate,
          description: description.trim(),
        });

        if (res.success) {
          showToast('Manual entry updated successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to update manual entry', 'error');
        }
      } else {
        const res = await createManualBalanceSheetEntry({
          entryType,
          category,
          amount: numAmount,
          entryDate,
          description: description.trim(),
        });

        if (res.success) {
          showToast('Manual entry added successfully', 'success');
          onSuccess();
          onClose();
        } else {
          showToast(res.error || 'Failed to add manual entry', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while saving entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Manual Financial Entry' : 'Add Manual Balance Sheet Entry'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Entry Type <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={entryType}
                onChange={(e) => handleTypeChange(e.target.value as ManualBalanceSheetEntryType)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="Asset">Asset (+/- Asset adjustment)</option>
                <option value="Liability">Liability (+/- Deposit/Payable)</option>
                <option value="Owner Capital">Owner Capital (+/- Capital)</option>
                <option value="Expense/Adjustment">Expense / P&L Adjustment</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ManualBalanceSheetCategory)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {CATEGORY_MAP[entryType].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Entry Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="pl-9 h-10 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Description / Remarks <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="e.g. Opening Bank Balance adjustment or manual capital injection"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="rounded-xl bg-[#FF7A00] hover:bg-[#e06b00] text-white"
          >
            {isEditing ? 'Update Entry' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
