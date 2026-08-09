'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loan, AdjustmentLedgerItem } from '@/types';
import { useToast } from '@/components/providers/toast-provider';
import {
  getAdjustmentLedger,
  addDailyInterest,
  recordAdjustmentPayment,
} from '@/lib/actions/adjustment-ledger';
import {
  SlidersHorizontal,
  PlusCircle,
  Receipt,
  RefreshCw,
  Calendar,
  IndianRupee,
  Calculator,
  Percent,
  CheckCircle2,
} from 'lucide-react';

interface AdjustmentLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onLoanUpdated?: () => void;
}

export function AdjustmentLedgerModal({
  isOpen,
  onClose,
  loan,
  onLoanUpdated,
}: AdjustmentLedgerModalProps) {
  const { showToast } = useToast();

  const [ledger, setLedger] = useState<AdjustmentLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'record_payment'>('history');

  // Form State for Add Daily Interest
  const [interestDate, setInterestDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysCount, setDaysCount] = useState<number>(1);
  const [interestRemarks, setInterestRemarks] = useState('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);

  // Form State for Record Payment
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!loan) return;
    setIsLoading(true);
    try {
      const res = await getAdjustmentLedger(loan.id);
      if (res.success) {
        setLedger(res.data);
      } else {
        showToast(res.error || 'Failed to fetch adjustment ledger', 'error');
      }
    } catch (err: any) {
      showToast('Error loading adjustment ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [loan, showToast]);

  useEffect(() => {
    if (isOpen && loan) {
      fetchLedger();
      setActiveTab('history');
      setPaymentAmount(0);
      setDaysCount(1);
    }
  }, [isOpen, loan, fetchLedger]);

  // Calculations for Adjustment Loan Parameters
  const principalAmount = loan?.amountGiven || 10000;
  const monthlyRate = loan?.interestRate !== undefined && loan.interestRate !== null && Number(loan.interestRate) > 0
    ? Number(loan.interestRate)
    : 6;
  const currentBalance = loan?.balanceAmount !== undefined ? loan.balanceAmount : principalAmount;

  // Monthly Interest Amount = Principal * (Monthly Rate / 100)
  const monthlyInterestAmt = principalAmount * (monthlyRate / 100);

  // Daily Interest = Monthly Interest Amount / 30
  const dailyInterestRateAmt = Math.round((monthlyInterestAmt / 30) * 100) / 100;

  // Total Interest Added for selected days
  const calculatedInterestForDays = Math.round((dailyInterestRateAmt * (Number(daysCount) || 1)) * 100) / 100;

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    if (monthlyRate <= 0) {
      showToast('Monthly interest rate is missing or 0%. Please update loan interest rate.', 'error');
      return;
    }

    if (daysCount <= 0) {
      showToast('Number of days must be at least 1 day', 'error');
      return;
    }

    setIsSubmittingInterest(true);
    try {
      const res = await addDailyInterest(loan.id, interestDate, daysCount, interestRemarks);
      if (res.success) {
        showToast(`Added ${daysCount} day(s) daily interest (${formatCurrency(calculatedInterestForDays)})`, 'success');
        fetchLedger();
        if (onLoanUpdated) onLoanUpdated();
        setActiveTab('history');
        setInterestRemarks('');
      } else {
        showToast(res.error || 'Failed to add daily interest', 'error');
      }
    } catch (err: any) {
      showToast('Error adding daily interest', 'error');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    if (paymentAmount <= 0) {
      showToast('Payment amount must be greater than ₹0', 'error');
      return;
    }

    if (paymentAmount > currentBalance) {
      showToast(`Payment amount (${formatCurrency(paymentAmount)}) cannot exceed outstanding balance (${formatCurrency(currentBalance)})`, 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await recordAdjustmentPayment(loan.id, paymentDate, paymentAmount, paymentRemarks);
      if (res.success) {
        showToast(`Recorded payment of ${formatCurrency(paymentAmount)}`, 'success');
        fetchLedger();
        if (onLoanUpdated) onLoanUpdated();
        setActiveTab('history');
        setPaymentAmount(0);
        setPaymentRemarks('');
      } else {
        showToast(res.error || 'Failed to record payment', 'error');
      }
    } catch (err: any) {
      showToast('Error recording payment', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const ledgerColumns: ColumnDef<AdjustmentLedgerItem>[] = [
    {
      accessorKey: 'transactionDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.transactionDate)}
        </span>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.transactionType === 'interest'
              ? 'error'
              : row.original.transactionType === 'payment'
              ? 'success'
              : 'info'
          }
          className="capitalize text-[10px]"
        >
          {row.original.transactionType}
        </Badge>
      ),
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Bal',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatCurrency(row.original.openingBalance)}</span>
      ),
    },
    {
      accessorKey: 'interestAdded',
      header: 'Interest Added',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-rose-600 font-semibold">
          {row.original.interestAdded > 0 ? `+${formatCurrency(row.original.interestAdded)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentReceived',
      header: 'Payment',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-emerald-600 font-semibold">
          {row.original.paymentReceived > 0 ? `-${formatCurrency(row.original.paymentReceived)}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'closingBalance',
      header: 'Closing Bal',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#FF7A00] font-bold">
          {formatCurrency(row.original.closingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 truncate max-w-[150px] inline-block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
  ];

  if (!loan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjustment Ledger: ${loan.customerName} (${loan.customerCode})`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* SUMMARY HEADER DISCLOSING: Principal, Monthly Interest %, Daily Interest (₹/day), Outstanding Balance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 border border-violet-800/60 text-white">
          {/* 1. Principal */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Principal
            </span>
            <span className="text-lg font-bold text-white mt-1">
              {formatCurrency(principalAmount)}
            </span>
          </div>

          {/* 2. Monthly Interest % */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-violet-300 uppercase tracking-wider">
              Monthly Interest %
            </span>
            <span className="text-lg font-extrabold text-violet-300 mt-1">
              {monthlyRate}% / month
            </span>
          </div>

          {/* 3. Daily Interest (₹/day) */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
              Daily Interest
            </span>
            <span className="text-lg font-extrabold text-emerald-400 mt-1">
              {formatCurrency(dailyInterestRateAmt)} / day
            </span>
          </div>

          {/* 4. Outstanding Balance */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-rose-300 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <span className="text-lg font-extrabold text-rose-400 mt-1">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        {/* Tab Selection & Auto Accrual Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeTab === 'history' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('history')}
              leftIcon={<Receipt className="w-3.5 h-3.5" />}
            >
              Ledger History
            </Button>

            <Button
              type="button"
              variant={activeTab === 'record_payment' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('record_payment')}
              leftIcon={<IndianRupee className="w-3.5 h-3.5" />}
              disabled={loan.isClosed}
            >
              Record Payment
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px] gap-1 py-1 px-2 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto Daily Accrual Active
            </Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchLedger}
              disabled={isLoading}
              title="Refresh & sync daily interest"
              className="h-8 px-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* TAB 1: LEDGER HISTORY TABLE */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <DataTable
              columns={ledgerColumns}
              data={ledger}
              emptyText={isLoading ? 'Loading ledger entries...' : 'No ledger transactions recorded yet.'}
              pageSize={10}
            />
          </div>
        )}

        {/* TAB 2: RECORD PAYMENT */}
        {activeTab === 'record_payment' && (
          <form onSubmit={handleRecordPayment} className="space-y-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/60 pb-2">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Record Adjustment Loan Payment
              </h4>
              <Badge variant="success" className="text-[10px]">
                Outstanding: {formatCurrency(currentBalance)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="paymentDate" className="text-xs font-semibold">
                  Payment Date
                </label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="paymentAmount" className="text-xs font-semibold">
                  Payment Amount Received (₹)
                </label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min={1}
                  step={1}
                  max={currentBalance}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {paymentAmount > 0 && (
              <div className="p-3.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Post-Payment Remaining Balance:
                  </span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Opening ({formatCurrency(currentBalance)}) - Payment ({formatCurrency(paymentAmount)})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(Math.max(0, currentBalance - paymentAmount))}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="paymentRemarks" className="text-xs font-semibold">
                Remarks (Optional)
              </label>
              <Input
                id="paymentRemarks"
                placeholder="e.g. Partial repayment"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab('history')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

