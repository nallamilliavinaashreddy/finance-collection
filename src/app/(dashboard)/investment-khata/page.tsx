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
      showToast('Error fetching Investment Khata data from Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, showToast]);

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
        } else if (type === 'Daily Interest') {
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
      header: 'Daily Interest Added (₹)',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <PiggyBank className="w-6 h-6 text-emerald-600" />
              Investment Khata
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Central Cash Flow
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Central business cash-flow ledger recording all capital, loan collections, depositor flows, and expenses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvestmentData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            leftIcon={<Settings className="w-3.5 h-3.5 text-amber-600" />}
          >
            Owner Rate: {metrics.monthlyInterestRate}%/mo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDailyInterest}
            isLoading={isAccruingInterest}
            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Add Daily Interest
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWithdrawalOpen(true)}
            leftIcon={<ArrowUpRight className="w-4 h-4 text-rose-600" />}
          >
            Owner Draw
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddCapitalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Owner Capital
          </Button>
        </div>
      </div>

      {/* Executive Dashboard Summary Cards Grid (6 Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Owner Capital */}
        <Card className="p-4 flex flex-col justify-between border-[#262626] dark:border-[#262626] bg-[#111111] dark:bg-[#111111]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
              Owner Capital
            </span>
            <Wallet className="w-3.5 h-3.5 text-[#FF7A00]" />
          </div>
          <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.ownerCapital || metrics.currentBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Owner capital balance</p>
        </Card>

        {/* Card 2: Investment Interest */}
        <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Investment Interest
            </span>
            <Coins className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.investmentInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Accrued daily interest</p>
        </Card>

        {/* Card 3: Loan Interest */}
        <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Loan Interest
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.loanInterest)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Collected loan interest</p>
        </Card>

        {/* Card 4: Expenses */}
        <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Expenses
            </span>
            <Receipt className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.expenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Operational expenses</p>
        </Card>

        {/* Card 5: Net Profit / Loss */}
        <Card
          className={`p-4 flex flex-col justify-between border ${
            metrics.netProfit >= 0
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-rose-500/30 bg-rose-500/10'
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              metrics.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            Net Profit / Loss
          </span>
          <div
            className={`text-2xl font-black mt-2 truncate ${
              metrics.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isLoading ? '...' : formatCurrency(metrics.netProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
          </p>
        </Card>

        {/* Card 6: Total Working Capital */}
        <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Working Capital
            </span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {isLoading ? '...' : formatCurrency(metrics.totalWorkingCapital || metrics.currentBalance)}
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
              Central Cash Flow Ledger & Daily Interest Feed
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
      />

      <WithdrawalReturnModal
        isOpen={isWithdrawalReturnOpen}
        onClose={() => setIsWithdrawalReturnOpen(false)}
        onSuccess={fetchInvestmentData}
      />

      <InvestmentSettingsModal
        isOpen={isSettingsOpen}
        currentRate={metrics.monthlyInterestRate}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={fetchInvestmentData}
      />
    </div>
  );
}

