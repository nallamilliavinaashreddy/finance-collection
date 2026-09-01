'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import { processLoanSettlement } from '@/lib/actions/settlements';
import {
  Scale,
  Calendar,
  IndianRupee,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  User,
  Hash,
  Coins,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onSettlementSuccess: () => void;
}

export function SettlementModal({
  isOpen,
  onClose,
  loan,
  onSettlementSuccess,
}: SettlementModalProps) {
  const [settlementType, setSettlementType] = useState<'full' | 'custom'>('full');
  const [settlementDate, setSettlementDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const totalTarget = loan?.totalCollectionAmount ?? 0;
  const currentCollected = loan?.collectedAmount ?? 0;
  const outstandingAmount = Math.max(0, totalTarget - currentCollected);

  useEffect(() => {
    if (loan) {
      setSettlementType('full');
      setSettlementDate(new Date().toISOString().split('T')[0]);
      setAmountPaidInput(outstandingAmount.toString());
      setPaymentMethod('Cash');
      setReferenceNumber('');
      setRemarks('');
      setIsConfirmStep(false);
    }
  }, [loan, outstandingAmount]);

  const numericAmountPaid =
    settlementType === 'full'
      ? outstandingAmount
      : Math.max(0, Number(amountPaidInput) || 0);

  const waivedAmount =
    settlementType === 'full'
      ? 0
      : Math.max(0, Math.round((outstandingAmount - numericAmountPaid) * 100) / 100);

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    if (numericAmountPaid < 0) {
      showToast('Settlement amount cannot be negative.', 'error');
      return;
    }

    if (numericAmountPaid > outstandingAmount) {
      showToast('Settlement amount cannot exceed the actual outstanding balance.', 'error');
      return;
    }

    setIsConfirmStep(true);
  };

  const handleFinalSubmit = async () => {
    if (!loan) return;
    setIsSubmitting(true);

    try {
      const res = await processLoanSettlement({
        loanId: loan.id,
        settlementType,
        settlementDate,
        amountPaid: numericAmountPaid,
        paymentMethod,
        referenceNumber,
        remarks,
        settledBy: 'Administrator',
      });

      if (res.success) {
        showToast(
          `Loan ${loan.customerCode} settled successfully! ${
            waivedAmount > 0 ? `(Waived: ${formatCurrency(waivedAmount)})` : ''
          }`,
          'success'
        );
        onSettlementSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to settle loan.', 'error');
      }
    } catch (err) {
      console.error('Settlement submission error:', err);
      showToast('An error occurred during loan settlement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsConfirmStep(false);
        onClose();
      }}
      title="Loan Settlement Register"
      description="Settle active loan with Full Payment or Custom Agreed Settlement."
      maxWidth="lg"
    >
      {!isConfirmStep ? (
        <form onSubmit={handleProceedToConfirm} className="flex flex-col gap-5 pt-1">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Customer & Loan
              </span>
              <div className="mt-1">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {loan.customerName}
                </p>
                <p className="text-[10px] font-mono text-slate-500">ID: {loan.customerCode}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Original Target
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">
                {formatCurrency(totalTarget)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Total Principal Paid
              </span>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {formatCurrency(currentCollected)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Total Outstanding
              </span>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {formatCurrency(outstandingAmount)}
              </div>
            </div>
          </div>

          {/* Settlement Mode Selector Tabs */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Settlement Option *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSettlementType('full');
                  setAmountPaidInput(outstandingAmount.toString());
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  settlementType === 'full'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'bg-white dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase tracking-wider">1. Full Settlement</span>
                  <span className="text-[10px] opacity-80 mt-0.5">Pay 100% of outstanding (₹{outstandingAmount})</span>
                </div>
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    settlementType === 'full' ? 'text-emerald-500' : 'opacity-0'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettlementType('custom');
                  setAmountPaidInput(outstandingAmount.toString());
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  settlementType === 'custom'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'bg-white dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase tracking-wider">2. Custom Settlement</span>
                  <span className="text-[10px] opacity-80 mt-0.5">Agreed settlement with optional waiver</span>
                </div>
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    settlementType === 'custom' ? 'text-amber-500' : 'opacity-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Settlement Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="pl-9 h-10 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Settlement Amount Paid (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max={outstandingAmount}
                  disabled={settlementType === 'full'}
                  value={settlementType === 'full' ? outstandingAmount : amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  className="pl-9 h-10 text-xs font-bold font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Reference Number (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. UTR / Receipt / Cheque #"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>

          {/* Dynamic Waiver / Adjustment Summary Box */}
          {settlementType === 'custom' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Custom Settlement Breakdown:</strong> Outstanding ({formatCurrency(outstandingAmount)}) - Agreed Paid ({formatCurrency(numericAmountPaid)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Waived / Adjusted:
                </span>
                <Badge variant="warning" className="font-mono text-xs font-bold py-1 px-2.5">
                  {formatCurrency(waivedAmount)}
                </Badge>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
              Settlement Remarks / Reason (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Agreed final settlement discount approved by management"
              rows={2}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#141414] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-[#262626]/80">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              Review & Settle Loan
            </Button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION STEP */
        <div className="flex flex-col gap-5 pt-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Are you sure you want to settle this loan?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This action will mark the loan as <strong>SETTLED</strong>, set remaining balance to <strong>₹0</strong>, and record actual cash received in Central Cash Flow. Future normal collection entries for this loan will be disabled.
              </p>
            </div>
          </div>

          {/* Detailed Review Table */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262626] overflow-hidden text-xs">
            <div className="p-3 bg-slate-100 dark:bg-[#141414] font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#262626] flex items-center justify-between">
              <span>Settlement Confirmation Summary</span>
              <Badge variant={settlementType === 'full' ? 'success' : 'warning'} className="font-mono uppercase text-[10px]">
                {settlementType} Settlement
              </Badge>
            </div>

            <div className="p-4 flex flex-col gap-2.5 bg-white dark:bg-[#111111]">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Customer Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{loan.customerName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Loan ID:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{loan.customerCode}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Outstanding Before Settlement:</span>
                <span className="font-bold text-rose-500 font-mono">{formatCurrency(outstandingAmount)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Actual Cash Amount Paid:</span>
                <span className="font-black text-emerald-500 font-mono text-sm">{formatCurrency(numericAmountPaid)}</span>
              </div>

              {settlementType === 'custom' && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Waived / Discounted Amount:</span>
                  <span className="font-bold text-amber-500 font-mono">{formatCurrency(waivedAmount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Remaining Balance After Settlement:</span>
                <span className="font-black text-emerald-600 font-mono">{formatCurrency(0)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/80 dark:border-[#262626]/80">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsConfirmStep(false)}
            >
              Back to Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm & Settle Loan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
