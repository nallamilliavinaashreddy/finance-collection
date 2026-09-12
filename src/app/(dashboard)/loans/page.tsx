'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loan } from '@/types';
import { LoanFormData } from '@/lib/validations/loan';
import { getLoans, createLoan, updateLoan, deleteLoan } from '@/lib/actions/loans';
import { LoanModal } from '@/components/loans/loan-modal';
import { DeleteLoanModal } from '@/components/loans/delete-loan-modal';
import { AdjustmentLedgerModal } from '@/components/loans/adjustment-ledger-modal';
import { SettlementModal } from '@/components/loans/settlement-modal';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import {
  Landmark,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  MapPin,
  FileText,
  Percent,
  Scale,
  Database,
} from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [adjustmentLoanForLedger, setAdjustmentLoanForLedger] = useState<Loan | null>(null);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementLoan, setSettlementLoan] = useState<Loan | null>(null);

  const { showToast } = useToast();

  // Load Loans list from Supabase
  const fetchLoans = useCallback(async (query: string = '', status: string = 'all', type: string = 'all') => {
    setIsLoading(true);
    try {
      const res = await getLoans(query, status, type);
      if (res.success && res.data) {
        setLoans(res.data);
      } else {
        showToast(res.error || 'Failed to query loans table in Supabase', 'error');
        setLoans([]);
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase loans table', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLoans(searchQuery, statusFilter, typeFilter);
  }, [searchQuery, statusFilter, typeFilter, fetchLoans]);

  // Handle Disburse / Edit Loan Form Submit to Supabase
  const handleFormSubmit = async (formData: LoanFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedLoan) {
        const res = await updateLoan(selectedLoan.id, formData);
        if (res.success && res.data) {
          showToast(`Loan record updated successfully.`, 'success', 'Loan Updated');
          setIsFormModalOpen(false);
          setSelectedLoan(null);
          fetchLoans(searchQuery, statusFilter, typeFilter);
        } else {
          showToast(res.error || 'Failed to update loan in Supabase', 'error');
        }
      } else {
        const res = await createLoan(formData);
        if (res.success && res.data) {
          showToast(
            `${(res.data.loanType || 'Daily').toUpperCase()} Loan disbursed for ${res.data.customerName}.`,
            'success',
            'Loan Disbursed'
          );
          setIsFormModalOpen(false);
          fetchLoans(searchQuery, statusFilter, typeFilter);
        } else {
          showToast(res.error || 'Failed to insert loan into Supabase', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during Supabase operation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete Loan in Supabase
  const handleConfirmDelete = async () => {
    if (!loanToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await deleteLoan(loanToDelete.id);
      if (res.success) {
        showToast(`Loan record deleted from Supabase.`, 'success', 'Loan Deleted');
        setIsDeleteModalOpen(false);
        setLoanToDelete(null);
        fetchLoans(searchQuery, statusFilter, typeFilter);
      } else {
        showToast(res.error || 'Failed to delete loan from Supabase', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during Supabase deletion.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Portfolio aggregates
  const totalAmountGiven = loans.reduce((acc, l) => acc + l.amountGiven, 0);
  const totalTargetCollection = loans.reduce((acc, l) => acc + l.totalCollectionAmount, 0);
  const activeLoansCount = loans.filter((l) => !l.isClosed).length;

  // Table Columns Definition
  const columns: ColumnDef<Loan>[] = [
    {
      accessorKey: 'customerCode',
      header: 'Customer ID',
      cell: ({ row }) => (
        <Badge variant="info" className="font-mono text-xs font-semibold tracking-wide">
          {row.original.customerCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name & Type',
      cell: ({ row }) => {
        const type = row.original.loanType || 'daily';
        const typeVariants: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
          daily: 'info',
          weekly: 'default',
          monthly: 'success',
          adjustment: 'warning',
        };
        return (
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {row.original.customerName}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant={typeVariants[type] || 'info'}
                className="text-[10px] uppercase font-semibold tracking-wide py-0"
              >
                [{type}]
              </Badge>
              {row.original.city && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {row.original.city}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amountGiven',
      header: 'Amount Given',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.original.amountGiven)}
        </span>
      ),
    },
    {
      accessorKey: 'totalCollectionAmount',
      header: 'Target Amount',
      cell: ({ row }) => (
        <span className="font-bold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.totalCollectionAmount)}
        </span>
      ),
    },
    {
      id: 'installment',
      header: 'Installment / Rate',
      cell: ({ row }) => {
        const type = row.original.loanType || 'daily';
        if (type === 'daily') {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(row.original.dailyAmount || 0)}/day
              </span>
              <span className="text-[10px] text-slate-400">{row.original.workingDays || 100} days</span>
            </div>
          );
        } else if (type === 'weekly') {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(row.original.weeklyAmount || 0)}/wk
              </span>
              <span className="text-[10px] text-slate-400">{row.original.totalWeeks || 10} weeks</span>
            </div>
          );
        } else if (type === 'monthly') {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-[#22C55E]">
                {formatCurrency(row.original.monthlyAmount || 0)} + {row.original.interestRate || 0}%
              </span>
              <span className="text-[10px] text-[#94A3B8]">{row.original.totalMonths || 12} mos</span>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-[#22C55E]">
                Custom ({row.original.interestRate || 0}%)
              </span>
              <span className="text-[10px] text-[#94A3B8]">Adjustment</span>
            </div>
          );
        }
      },
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Remaining Balance',
      cell: ({ row }) => (
        <span className="font-bold text-[#EF4444]">
          {formatCurrency(row.original.balanceAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={!row.original.isClosed ? 'success' : 'outline'}
          className="uppercase text-[10px] font-bold"
        >
          {row.original.isClosed ? 'Closed' : 'Active'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isAdj = row.original.loanType === 'adjustment';
        const isActive = !row.original.isClosed;

        return (
          <div className="flex items-center gap-1.5">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSettlementLoan(row.original);
                  setIsSettlementModalOpen(true);
                }}
                className="h-8 px-2.5 text-[11px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 shadow-xs"
                title="Settle Loan (Full or Custom)"
              >
                <Scale className="w-3.5 h-3.5 mr-1" />
                Settlement
              </Button>
            )}

            {isAdj && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdjustmentLoanForLedger(row.original);
                  setIsLedgerModalOpen(true);
                }}
                className="h-8 px-2 text-[11px] font-semibold border-violet-200 dark:border-violet-900/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                title="View Adjustment Statement Ledger"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Ledger
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedLoan(row.original);
                setIsFormModalOpen(true);
              }}
              className="h-8 w-8 p-0 text-slate-600 hover:text-[#FF7A00] dark:text-slate-400 dark:hover:text-[#FF7A00]"
              title="Edit Loan"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoanToDelete(row.original);
                setIsDeleteModalOpen(true);
              }}
              className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
              title="Delete Loan"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Loans Portfolio Management
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-[#22C55E]" />
              Supabase Connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            Manage, record, and track all active & closed loans across Daily, Weekly, Monthly, and Adjustment types.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedLoan(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shrink-0"
        >
          Disburse New Loan
        </Button>
      </div>

      {/* Top Portfolio Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Total Disbursed Capital
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {formatCurrency(totalAmountGiven)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Target Collection Amount
              </span>
              <span className="text-2xl font-bold text-[#F59E0B] mt-0.5">
                {formatCurrency(totalTargetCollection)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Active Loans Ratio
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {activeLoansCount} / {loans.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Loans Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-[#26344D]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Active & Closed Loans Directory</CardTitle>
              <CardDescription>
                Separated by Daily, Weekly, Monthly, and Adjustment loan types
              </CardDescription>
            </div>

            {/* Search & Status Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-[#26344D] bg-white dark:bg-[#1B2638] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed Only</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, Name, City..."
                  className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-300 dark:border-[#26344D] bg-white dark:bg-[#1B2638] text-slate-900 dark:text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6] transition-colors"
                />
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => fetchLoans(searchQuery, statusFilter, typeFilter)}
                className="px-3"
                title="Refresh from Supabase"
              >
                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
              </Button>
            </div>
          </div>

          {/* Loan Type Separation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-[#26344D]/50 pt-3">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#4F8CFF] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#26344D]'
              }`}
            >
              All Loans ({loans.length})
            </button>
            <button
              onClick={() => setTypeFilter('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'daily'
                  ? 'bg-[#F97316] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#F97316] border border-[#26344D]'
              }`}
            >
              Daily Loans ({loans.filter(l => (l.loanType || 'daily') === 'daily').length})
            </button>
            <button
              onClick={() => setTypeFilter('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'weekly'
                  ? 'bg-[#8B5CF6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#8B5CF6] border border-[#26344D]'
              }`}
            >
              Weekly Loans ({loans.filter(l => l.loanType === 'weekly').length})
            </button>
            <button
              onClick={() => setTypeFilter('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'monthly'
                  ? 'bg-[#3B82F6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#3B82F6] border border-[#26344D]'
              }`}
            >
              Monthly Loans ({loans.filter(l => l.loanType === 'monthly').length})
            </button>
            <button
              onClick={() => setTypeFilter('adjustment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'adjustment'
                  ? 'bg-[#14B8A6] text-[#F8FAFC] shadow-sm'
                  : 'bg-[#182237] text-[#94A3B8] hover:text-[#14B8A6] border border-[#26344D]'
              }`}
            >
              Adjustment Loans ({loans.filter(l => l.loanType === 'adjustment').length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={loans}
            emptyText={
              isLoading
                ? 'Querying Supabase loans table...'
                : searchQuery
                ? `No loans found matching "${searchQuery}".`
                : 'No loans disbursed yet. Click "Disburse New Loan" to create one.'
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Disburse / Edit Loan Modal */}
      <LoanModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedLoan(null);
        }}
        onSubmit={handleFormSubmit}
        loan={selectedLoan}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteLoanModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setLoanToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loan={loanToDelete}
        isLoading={isSubmitting}
      />

      {/* Adjustment Ledger Statement Modal */}
      <AdjustmentLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setAdjustmentLoanForLedger(null);
        }}
        loan={adjustmentLoanForLedger}
        onLoanUpdated={() => fetchLoans(searchQuery, statusFilter, typeFilter)}
      />

      {/* Loan Settlement Modal */}
      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => {
          setIsSettlementModalOpen(false);
          setSettlementLoan(null);
        }}
        loan={settlementLoan}
        onSettlementSuccess={() => fetchLoans(searchQuery, statusFilter, typeFilter)}
      />
    </div>
  );
}
