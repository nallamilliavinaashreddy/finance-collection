'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Chit } from '@/types';
import { recordChitPrizeReceived, deleteChitPrizeReceived } from '@/lib/actions/chits';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency } from '@/lib/utils';
import { Trophy, Calendar, DollarSign, FileText, Coins, Trash2, CalendarDays, Info } from 'lucide-react';

interface ChitPrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chit: Chit | null;
}

export function ChitPrizeModal({
  isOpen,
  onClose,
  onSuccess,
  chit,
}: ChitPrizeModalProps) {
  const { showToast } = useToast();

  const [prizeMonth, setPrizeMonth] = useState<number>(1);
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && chit) {
      setPrizeMonth(chit.paidMonths > 0 ? chit.paidMonths : 1);
      setPrizeAmount(chit.prizeAmount || 0);
      setDiscountAmount(0);
      setReceivedDate(chit.prizeDate || new Date().toISOString().split('T')[0]);
      setRemarks('');
    }
  }, [isOpen, chit]);

  if (!chit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prizeMonth || prizeMonth <= 0) {
      showToast('Prize Month is required (e.g. Month 5, Month 10)', 'error');
      return;
    }

    if (prizeAmount <= 0) {
      showToast('Net Prize Amount Received must be greater than ₹0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordChitPrizeReceived({
        chitId: chit.id,
        prizeMonth,
        prizeAmount,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        receivedDate,
        remarks,
      });

      if (res.success) {
        showToast(
          `Prize amount of ${formatCurrency(prizeAmount)} (Month #${prizeMonth}) recorded! Investment balance increased.`,
          'success'
        );
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to record chit prize received', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrize = async () => {
    if (!confirm('Are you sure you want to remove this Prize Received entry?')) return;
    setIsDeleting(true);
    try {
      const res = await deleteChitPrizeReceived(chit.id);
      if (res.success) {
        showToast('Prize Received record removed. Investment balance updated.', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to remove prize record', 'error');
      }
    } catch (err: any) {
      showToast('Error removing prize record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chit.prizeTaken ? 'Edit Chit Prize Received' : 'Record Chit Prize Received'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subscription Info Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />
              {chit.chitCompany}
            </span>
            <Badge variant="outline" className="font-mono text-xs border-amber-300 text-amber-700 dark:text-amber-300">
              Group: {chit.groupNumber}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
            <div>
              <span className="text-slate-500">Chit Value:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(chit.chitValue)}</p>
            </div>
            <div>
              <span className="text-slate-500">Duration:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{chit.totalMonths} Months</p>
            </div>
            <div>
              <span className="text-slate-500">Prize Status:</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                {chit.prizeTaken ? `Taken (${formatCurrency(chit.prizeAmount)})` : 'Not Taken Yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Business Rule Notice Callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#141414] dark:bg-[#111111] border border-[#262626] dark:border-[#262626] text-xs text-[#FF7A00] dark:text-[#FF7A00]">
          <Info className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Receiving the prize money does <strong>NOT</strong> complete the chit subscription. Monthly installment payments continue until the full duration ends.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prize Month (Required) */}
          <div className="space-y-1.5">
            <label htmlFor="prizeMonth" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prize Month (Installment #) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="prizeMonth"
                type="number"
                min={1}
                max={chit.totalMonths}
                step={1}
                placeholder="e.g. 5, 10, 18, 24"
                value={prizeMonth || ''}
                onChange={(e) => setPrizeMonth(Number(e.target.value))}
                className="pl-9 h-10 font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500">Month in which the chit was taken (e.g. Month 5, 12, 18).</p>
          </div>

          {/* Prize Date */}
          <div className="space-y-1.5">
            <label htmlFor="receivedDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prize Date Received <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="receivedDate"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="pl-9 h-10"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net Prize Amount Received */}
          <div className="space-y-1.5">
            <label htmlFor="prizeAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Net Prize Amount Received (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="prizeAmount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 420000"
                value={prizeAmount || ''}
                onChange={(e) => setPrizeAmount(Number(e.target.value))}
                className="pl-9 h-10 font-bold text-emerald-600 dark:text-emerald-400"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500">Actual cash amount received in hand / bank.</p>
          </div>

          {/* Optional Auction Discount / Bid Loss */}
          <div className="space-y-1.5">
            <label htmlFor="discountAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Auction Discount / Bid Loss (₹)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                id="discountAmount"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 80000"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="pl-9 h-10 font-semibold text-amber-600 dark:text-amber-400"
              />
            </div>
            <p className="text-[10px] text-slate-500">Discount or bid loss surrendered at auction.</p>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remarks / Auction Audit Details (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              id="remarks"
              placeholder="e.g. Lifted auction on month #12, SBI Cheque #920410"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {chit.prizeTaken ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDeletePrize}
              isLoading={isDeleting}
              className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Remove Prize
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="primary" leftIcon={<Trophy className="w-4 h-4" />}>
              Save Prize Received
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

