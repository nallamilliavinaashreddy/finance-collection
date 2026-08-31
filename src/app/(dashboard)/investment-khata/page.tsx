'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  getInvestmentTransactions,
  getInvestmentMetrics,
  addDailyInterest,
} from '@/lib/actions/investment';
import { InvestmentTransaction, InvestmentMetrics } from '@/types';
import { AddCapitalModal } from '@/components/investment/add-capital-modal';
import { WithdrawalModal } from '@/components/investment/withdrawal-modal';
import { WithdrawalReturnModal } from '@/components/investment/withdrawal-return-modal';
import { InvestmentSettingsModal } from '@/components/investment/investment-settings-modal';
import { useToast } from '@/components/providers/toast-provider';
import {
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  ArrowUpRight,
  Database,
  TrendingUp,
  Settings,
  History,
  Wallet,
  Coins,
  Building2,
  Receipt,
} from 'lucide-react';

export default function InvestmentKhataPage() {
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [metrics, setMetrics] = useState<InvestmentMetrics>({
    ownerCapital: 0,
    totalWorkingCapital: 0,
    currentBalance: 0,
    investmentInterest: 0,
    loanInterest: 0,
    expenses: 0,
    businessWithdrawals: 0,
    netProfit: 0,
    monthlyInterestRate: 5.0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccruingInterest, setIsAccruingInterest] = useState(false);

  // Modals
  const [isAddCapitalOpen, setIsAddCapitalOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isWithdrawalReturnOpen, setIsWithdrawalReturnOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { showToast } = useToast();

  const fetchInvestmentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txRes, metRes] = await Promise.all([
        getInvestmentTransactions(searchQuery, typeFilter),
        getInvestmentMetrics(),
      ]);

      if (txRes.success && txRes.data) {
        setTransactions(txRes.data);
      }
      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching Investment Khata data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    fetchInvestmentData();
  }, [fetchInvestmentData]);

  // Add Daily Interest Trigger
  const handleAddDailyInterest = async () => {
    setIsAccruingInterest(true);
    try {
      const res = await addDailyInterest(1);
      if (res.success) {
        if ((res.interestAdded || 0) > 0) {
          showToast(`Added ${formatCurrency(res.interestAdded || 0)} daily simple interest to Investment Balance!`, 'success');
        } else {
          showToast('Daily interest calculated (zero balance or already updated).', 'info');
        }
        fetchInvestmentData();
      } else {
        showToast(res.error || 'Failed to add daily interest', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred while accruing daily interest', 'error');
    } finally {
      setIsAccruingInterest(false);
    }
  };

  // Transaction Ledger Table Columns
  const ledgerColumns: ColumnDef<InvestmentTransaction>[] = [
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
      header: 'Transaction Type',
      cell: ({ row }) => {
        const type = row.original.transactionType;
        let variant: 'success' | 'error' | 'info' | 'outline' | 'warning' = 'info';

        if (
          type === 'Capital Added' ||
          type === 'Collection Received' ||
          type === 'Capital Returned' ||
          type === 'Withdrawal Return' ||
          type === 'Stamp Income' ||
          type === 'Chit Prize Received'
        ) {
          variant = 'success';
        } else if (type === 'Loan Given' || type === 'Business Withdrawal') {
          variant = 'error';
        } else if (
          type === 'Expense' ||
          type === 'Stamp Expense' ||
          type === 'Chit Payment' ||
          type === 'Chit Installment'
        ) {
          variant = 'warning';
        } else if (type === 'Daily Interest' || type === 'Annual Interest') {
          variant = 'info';
        }

        return (
          <Badge variant={variant} className="font-semibold text-xs">
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Balance (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatCurrency(row.original.openingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'amountIn',
      header: 'Amount In (₹)',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {row.original.amountIn > 0 ? formatCurrency(row.original.amountIn) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amountOut',
      header: 'Amount Out (₹)',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {row.original.amountOut > 0 ? formatCurrency(row.original.amountOut) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'dailyInterestAdded',
      header: 'Accrued Interest (₹)',
      cell: ({ row }) => (
        <span className="font-bold text-amber-600 dark:text-amber-400">
          {row.original.dailyInterestAdded > 0 ? formatCurrency(row.original.dailyInterestAdded) : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Closing Balance (₹)',
      cell: ({ row }) => (
        <span className="font-extrabold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.balance)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks / Reference',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[220px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header Bar */}
      <div className="rounded-2xl p-6 glass-panel shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Investment Khata
            </h2>
            <Badge variant="success" className="gap-1 text-[10px] shadow-xs">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Central Cash Flow
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Central business cash-flow ledger recording all capital, loan collections, depositor flows, and expenses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvestmentData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="rounded-xl border-slate-300 dark:border-[#262626] bg-white/50 dark:bg-[#141414]/50 backdrop-blur-md shadow-xs"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            leftIcon={<Settings className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            className="rounded-xl border-slate-300 dark:border-[#262626] bg-white/50 dark:bg-[#141414]/50 backdrop-blur-md shadow-xs"
          >
            Annual Rate: {metrics.annualInterestRate ?? 18}%/yr ({metrics.interestType === 'compound' ? 'Compound' : 'Simple'})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDailyInterest}
            isLoading={isAccruingInterest}
            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            className="rounded-xl border-slate-300 dark:border-[#262626] bg-white/50 dark:bg-[#141414]/50 backdrop-blur-md shadow-xs"
          >
            Check Yearly Interest
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWithdrawalOpen(true)}
            leftIcon={<ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            className="rounded-xl border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 backdrop-blur-md shadow-xs"
          >
            Take Capital
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddCapitalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-xl shadow-md"
          >
            Add Direct Investment
          </Button>
        </div>
      </div>

      {/* Executive Dashboard Summary Cards Grid (6 Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Current Capital */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
              Current Capital
            </span>
            <Wallet className="w-3.5 h-3.5 text-[#FF7A00]" />
          </div>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.currentCapital ?? metrics.ownerCapital)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct + Chit + Deposit - Drawn</p>
        </Card>

        {/* Card 2: Capital Added */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Capital Added
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalCapitalAdded ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total invested capital</p>
        </Card>

        {/* Card 3: Capital Withdrawn */}
        <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Capital Withdrawn
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalCapitalWithdrawn ?? metrics.businessWithdrawals)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total taken capital</p>
        </Card>

        {/* Card 4: Accrued Interest */}
        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Accrued Interest
            </span>
            <Coins className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.accruedInterest ?? metrics.investmentInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.interestType === 'compound' ? 'Compound' : 'Simple'} interest ({metrics.annualInterestRate ?? 18}%/yr)
          </p>
        </Card>

        {/* Card 5: Total Investment Value */}
        <Card className="p-4 flex flex-col justify-between border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Total Value
            </span>
            <Receipt className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalInvestmentValue ?? (metrics.ownerCapital + metrics.investmentInterest))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Capital + Accrued Interest</p>
        </Card>

        {/* Card 6: Total Working Capital */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Working Balance
            </span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.currentBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Current cash balance</p>
        </Card>
      </div>

      {/* Central Cash Flow Ledger */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              Central Cash Flow Ledger & Accrued Interest Feed
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Transaction Types</option>
                <option value="Capital Added">Capital Added</option>
                <option value="Loan Given">Loan Given</option>
                <option value="Collection Received">Collection Received</option>
                <option value="Expense">Expense</option>
                <option value="Stamp Expense">Stamp Expense</option>
                <option value="Stamp Income">Stamp Income</option>
                <option value="Chit Payment">Chit Payment</option>
                <option value="Chit Installment">Chit Installment</option>
                <option value="Chit Prize Received">Chit Prize Received</option>
                <option value="Business Withdrawal">Business Withdrawal</option>
                <option value="Withdrawal Return">Withdrawal Return</option>
                <option value="Daily Interest">Daily Interest</option>
                <option value="Capital Returned">Capital Returned</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <DataTable
            columns={ledgerColumns}
            data={transactions}
            emptyText={isLoading ? 'Loading transaction feed...' : 'No investment transactions recorded.'}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Owner Modals */}
      <AddCapitalModal
        isOpen={isAddCapitalOpen}
        onClose={() => setIsAddCapitalOpen(false)}
        onSuccess={fetchInvestmentData}
      />

      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        onSuccess={fetchInvestmentData}
        availableCapital={metrics.ownerCapital || metrics.currentBalance}
      />

      <WithdrawalReturnModal
        isOpen={isWithdrawalReturnOpen}
        onClose={() => setIsWithdrawalReturnOpen(false)}
        onSuccess={fetchInvestmentData}
      />

      <InvestmentSettingsModal
        isOpen={isSettingsOpen}
        currentRate={metrics.annualInterestRate ?? 18}
        currentInterestType={metrics.interestType || 'simple'}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={fetchInvestmentData}
      />
    </div>
  );
}

