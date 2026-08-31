'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  getReportsData,
  ReportsData,
  TimeFilterType,
  CustomerReportItem,
  CollectionReportItem,
  LoanReportItem,
  ExpenseReportItem,
  StampReportItem,
  ChitPaymentReportItem,
} from '@/lib/actions/reports';
import { exportToExcel, exportToPdf } from '@/lib/export-utils';
import { useToast } from '@/components/providers/toast-provider';
import {
  Users,
  Landmark,
  Receipt,
  BarChart3,
  IndianRupee,
  RefreshCw,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  PiggyBank,
  Percent,
  Database,
  SlidersHorizontal,
  MapPin,
  Wallet,
  Tag,
  FileSignature,
  Coins,
  Building2,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'collections' | 'loans' | 'adjustment' | 'expenses' | 'stamps' | 'chits' | 'investment' | 'interest'>('customers');
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getReportsData(timeFilter, customStartDate, customEndDate, searchQuery);
      if (res.success && res.data) {
        setReportsData(res.data);
      } else {
        showToast(res.error || 'Failed to fetch reports analytics from Supabase', 'error');
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase database for reports', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter, customStartDate, customEndDate, searchQuery, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (!reportsData) return;

    if (activeTab === 'customers') {
      const exportRows = reportsData.customerReports.map((c) => ({
        'Customer ID': c.customerCode,
        'Customer Name': c.customerName,
        'Mobile Number': c.mobileNumber,
        'Loan Amount (₹)': c.loanAmount,
        'Target Amount (₹)': c.totalTarget,
        'Collected Amount (₹)': c.collectedAmount,
        'Balance Amount (₹)': c.remainingBalance,
        'Loan Status': c.loanStatus,
        'Loan Type': c.loanType,
      }));
      exportToExcel(exportRows, `Customer_Report_${timeFilter}`);
      showToast('Exported Customer Report to Excel', 'success');
    } else if (activeTab === 'collections') {
      const exportRows = reportsData.collectionReports.map((c) => ({
        Date: c.paymentDate,
        'Customer ID': c.customerCode,
        'Customer Name': c.customerName,
        'Amount Collected (₹)': c.amountPaid,
        'Remaining Balance (₹)': c.remainingBalanceAfterPayment,
        Remarks: c.remarks,
      }));
      exportToExcel(exportRows, `Collection_Report_${timeFilter}`);
      showToast('Exported Collection Report to Excel', 'success');
    } else if (activeTab === 'loans') {
      const exportRows = reportsData.loanReports.map((l) => ({
        'Customer ID': l.customerCode,
        'Customer Name': l.customerName,
        Type: l.loanType,
        Place: l.city || 'N/A',
        'Amount Given (₹)': l.amountGiven,
        'Target Amount (₹)': l.targetAmount,
        'Installment Amount (₹)': l.dailyAmount,
        'Start Date': l.startDate,
        'End Date': l.endDate,
        'Remaining Balance (₹)': l.remainingBalance,
        Status: l.status,
      }));
      exportToExcel(exportRows, `Loan_Report_${timeFilter}`);
      showToast('Exported Loan Disbursal Report to Excel', 'success');
    } else if (activeTab === 'expenses') {
      const exportRows = (reportsData.expenseReportData?.expenseReports || []).map((e) => ({
        'Expense Date': e.expenseDate,
        Category: e.category,
        Description: e.description,
        'Paid To': e.paidTo || 'N/A',
        'Payment Mode': e.paymentMode,
        'Amount (₹)': e.amount,
        Remarks: e.remarks || '-',
      }));
      exportToExcel(exportRows, `Expenses_Report_${timeFilter}`);
      showToast('Exported Expenses Report to Excel', 'success');
    } else if (activeTab === 'stamps') {
      const exportRows = (reportsData.stampReportData?.stampReports || []).map((s) => ({
        'Stamp Date': s.stampDate,
        'Customer ID': s.customerCode,
        'Customer Name': s.customerName,
        'Stamp Type': s.stampType,
        'Stamp Serial/No': s.stampNumber || 'N/A',
        Vendor: s.vendor || 'N/A',
        'Cost Amount (₹)': s.amount,
        Remarks: s.remarks || '-',
      }));
      exportToExcel(exportRows, `Stamps_Report_${timeFilter}`);
      showToast('Exported Stamps Report to Excel', 'success');
    } else if (activeTab === 'chits') {
      const exportRows = (reportsData.chitReportData?.chitPaymentReports || []).map((cp) => ({
        'Payment Date': cp.paymentDate,
        'Chit Company': cp.chitCompany,
        'Group Number': cp.groupNumber,
        'Amount Paid (₹)': cp.amount,
        'Receipt/UTR': cp.receiptNumber || 'N/A',
        'Payment Mode': cp.paymentMode,
        Remarks: cp.remarks || '-',
      }));
      exportToExcel(exportRows, `Chits_Payment_Report_${timeFilter}`);
      showToast('Exported Chits Payment Report to Excel', 'success');
    } else if (activeTab === 'investment') {
      const exportRows = (reportsData.investmentReportData?.cashFlowReports || []).map((tx) => ({
        Date: tx.transactionDate,
        'Transaction Type': tx.transactionType,
        'Amount In (₹)': tx.amountIn,
        'Amount Out (₹)': tx.amountOut,
        'Running Balance (₹)': tx.balance,
        Remarks: tx.remarks || '-',
      }));
      exportToExcel(exportRows, `Investment_Khata_Report_${timeFilter}`);
      showToast('Exported Investment Khata Report to Excel', 'success');
    } else if (activeTab === 'interest') {
      const exportRows = (reportsData.interestReportData?.interestReports || []).map((i: any) => ({
        Date: i.transactionDate,
        Customer: i.customerName,
        'Customer ID': i.customerCode,
        'Interest Type': i.interestType,
        'Interest Amount (₹)': i.interestAmount,
        Remarks: i.remarks || '-',
      }));
      exportToExcel(exportRows, `Interest_Collection_Report_${timeFilter}`);
      showToast('Exported Interest Collection Report to Excel', 'success');
    }
  };

  // Handle Export to PDF
  const handleExportPdf = () => {
    if (!reportsData) return;

    if (activeTab === 'customers') {
      const headers = ['Cust ID', 'Name', 'Mobile', 'Loan (₹)', 'Target (₹)', 'Collected (₹)', 'Balance (₹)', 'Status'];
      const rows = reportsData.customerReports.map((c) => [
        c.customerCode,
        c.customerName,
        c.mobileNumber,
        formatCurrency(c.loanAmount),
        formatCurrency(c.totalTarget),
        formatCurrency(c.collectedAmount),
        formatCurrency(c.remainingBalance),
        c.loanStatus,
      ]);
      exportToPdf('Customer Account Summary Report', headers, rows, `Customer_Report_${timeFilter}`);
      showToast('Exported Customer Report to PDF', 'success');
    } else if (activeTab === 'collections') {
      const headers = ['Date', 'Cust ID', 'Name', 'Amount (₹)', 'Post Balance (₹)', 'Remarks'];
      const rows = reportsData.collectionReports.map((c) => [
        c.paymentDate,
        c.customerCode,
        c.customerName,
        formatCurrency(c.amountPaid),
        formatCurrency(c.remainingBalanceAfterPayment),
        c.remarks,
      ]);
      exportToPdf('Collection Statements Report', headers, rows, `Collection_Report_${timeFilter}`);
      showToast('Exported Collection Report to PDF', 'success');
    } else if (activeTab === 'expenses') {
      const headers = ['Date', 'Category', 'Description', 'Paid To', 'Mode', 'Amount (₹)'];
      const rows = (reportsData.expenseReportData?.expenseReports || []).map((e) => [
        e.expenseDate,
        e.category,
        e.description,
        e.paidTo || '-',
        e.paymentMode,
        formatCurrency(e.amount),
      ]);
      exportToPdf('Business Expenses Report', headers, rows, `Expenses_Report_${timeFilter}`);
      showToast('Exported Expenses Report to PDF', 'success');
    } else if (activeTab === 'stamps') {
      const headers = ['Date', 'Cust ID', 'Customer Name', 'Stamp Type', 'Serial/No', 'Cost (₹)'];
      const rows = (reportsData.stampReportData?.stampReports || []).map((s) => [
        s.stampDate,
        s.customerCode,
        s.customerName,
        s.stampType,
        s.stampNumber || '-',
        formatCurrency(s.amount),
      ]);
      exportToPdf('Legal Stamps Cost Report', headers, rows, `Stamps_Report_${timeFilter}`);
      showToast('Exported Stamps Report to PDF', 'success');
    } else if (activeTab === 'chits') {
      const headers = ['Date', 'Chit Company', 'Group No', 'Mode', 'Receipt/UTR', 'Amount Paid (₹)'];
      const rows = (reportsData.chitReportData?.chitPaymentReports || []).map((cp) => [
        cp.paymentDate,
        cp.chitCompany,
        cp.groupNumber,
        cp.paymentMode,
        cp.receiptNumber || '-',
        formatCurrency(cp.amount),
      ]);
      exportToPdf('Chit Subscriptions Payment Report', headers, rows, `Chits_Report_${timeFilter}`);
      showToast('Exported Chits Report to PDF', 'success');
    } else if (activeTab === 'investment') {
      const headers = ['Date', 'Type', 'In (₹)', 'Out (₹)', 'Balance (₹)', 'Remarks'];
      const rows = (reportsData.investmentReportData?.cashFlowReports || []).map((tx) => [
        tx.transactionDate,
        tx.transactionType,
        tx.amountIn > 0 ? formatCurrency(tx.amountIn) : '-',
        tx.amountOut > 0 ? formatCurrency(tx.amountOut) : '-',
        formatCurrency(tx.balance),
        tx.remarks || '-',
      ]);
      exportToPdf('Investment Khata Ledger Report', headers, rows, `Investment_Khata_Report_${timeFilter}`);
      showToast('Exported Investment Khata Report to PDF', 'success');
    } else if (activeTab === 'interest') {
      const headers = ['Date', 'Customer', 'Cust ID', 'Type', 'Amount (₹)', 'Remarks'];
      const rows = (reportsData.interestReportData?.interestReports || []).map((i: any) => [
        i.transactionDate,
        i.customerName || 'Customer',
        i.customerCode || 'N/A',
        i.interestType,
        formatCurrency(i.interestAmount),
        i.remarks || '-',
      ]);
      exportToPdf('Customer Interest Collection Report', headers, rows, `Interest_Report_${timeFilter}`);
      showToast('Exported Interest Report to PDF', 'success');
    }
  };

  // Columns for Investment Cash Flow Report Table
  const investmentColumns: ColumnDef<any>[] = [
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
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold text-xs">
          {row.original.transactionType}
        </Badge>
      ),
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Balance (₹)',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatCurrency(row.original.openingBalance || 0)}
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
      header: 'Daily Interest (₹)',
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
          {formatCurrency(row.original.balance || 0)}
        </span>
      ),
    },
  ];

  // Columns for Stamp Reports Table
  const stampColumns: ColumnDef<StampReportItem>[] = [
    {
      accessorKey: 'stampDate',
      header: 'Stamp Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.stampDate)}
        </span>
      ),
    },
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
      header: 'Customer Name',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {row.original.customerName}
        </span>
      ),
    },
    {
      accessorKey: 'stampType',
      header: 'Stamp Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-xs border-violet-200 text-violet-700 dark:text-violet-300">
          {row.original.stampType}
        </Badge>
      ),
    },
    {
      accessorKey: 'stampNumber',
      header: 'Serial Number',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.stampNumber || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[120px] truncate block">
          {row.original.vendor || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Stamp Amount',
      cell: ({ row }) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
  ];

  // Columns for Chit Payments Report Table
  const chitColumns: ColumnDef<ChitPaymentReportItem>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.paymentDate)}
        </span>
      ),
    },
    {
      accessorKey: 'chitCompany',
      header: 'Chit Company',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {row.original.chitCompany}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Group: {row.original.groupNumber}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.paymentMode}
        </Badge>
      ),
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt / UTR',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.receiptNumber || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount Paid',
      cell: ({ row }) => (
        <span className="font-extrabold text-amber-600 dark:text-amber-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
  ];

  // Standard Customer Columns
  const customerColumns: ColumnDef<CustomerReportItem>[] = [
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
      header: 'Customer Name',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {row.original.customerName}
        </span>
      ),
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Mobile Number',
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.mobileNumber}</span>,
    },
    {
      accessorKey: 'loanAmount',
      header: 'Amount Given',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.original.loanAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'totalTarget',
      header: 'Total Target',
      cell: ({ row }) => (
        <span className="font-bold text-[#FF7A00] dark:text-[#FF7A00]">
          {formatCurrency(row.original.totalTarget)}
        </span>
      ),
    },
    {
      accessorKey: 'collectedAmount',
      header: 'Collected',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.collectedAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalance',
      header: 'Balance',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          {formatCurrency(row.original.remainingBalance)}
        </span>
      ),
    },
  ];

  // Columns for Expense Reports Table
  const expenseColumns: ColumnDef<ExpenseReportItem>[] = [
    {
      accessorKey: 'expenseDate',
      header: 'Expense Date',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {formatDate(row.original.expenseDate)}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold text-xs">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate block">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'paidTo',
      header: 'Paid To',
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">
          {row.original.paidTo || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px]">
          {row.original.paymentMode}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-extrabold text-rose-600 dark:text-rose-400">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
  ];

  // Columns for Interest Report Table
  const interestColumns: ColumnDef<any>[] = [
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
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {row.original.customerName || 'Customer'}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            ID: {row.original.customerCode || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'interestType',
      header: 'Interest Type',
      cell: ({ row }) => (
        <Badge variant="info" className="font-semibold text-xs capitalize">
          {row.original.interestType} Loan
        </Badge>
      ),
    },
    {
      accessorKey: 'interestAmount',
      header: 'Interest Collected (₹)',
      cell: ({ row }) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.interestAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 max-w-[200px] truncate block">
          {row.original.remarks || '-'}
        </span>
      ),
    },
  ];

  const summary = reportsData?.summary;
  const expData = reportsData?.expenseReportData;
  const stData = reportsData?.stampReportData;
  const chitData = reportsData?.chitReportData;
  const invData = reportsData?.investmentReportData;
  const intData = reportsData?.interestReportData;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Reports & Analytics
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Live PostgreSQL Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable business statements, customer ledgers, daily/weekly/monthly collections, expenses, stamps, chits, and Investment Khata.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            leftIcon={<FileText className="w-4 h-4 text-rose-600" />}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Filter Presets */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Time Filter:
            </span>
            <div className="flex flex-wrap gap-1">
              {(['all', 'today', 'yesterday', 'this_week', 'this_month', 'custom'] as TimeFilterType[]).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={timeFilter === filter ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter(filter)}
                    className="capitalize text-xs h-8 px-3"
                  >
                    {filter.replace('_', ' ')}
                  </Button>
                )
              )}
            </div>
          </div>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Button
          variant={activeTab === 'customers' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('customers')}
          leftIcon={<Users className="w-3.5 h-3.5" />}
        >
          Customer Summary
        </Button>

        <Button
          variant={activeTab === 'investment' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('investment')}
          leftIcon={<PiggyBank className="w-3.5 h-3.5 text-emerald-500" />}
        >
          Investment Khata Report
        </Button>

        <Button
          variant={activeTab === 'interest' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('interest')}
          leftIcon={<Percent className="w-3.5 h-3.5 text-emerald-600" />}
        >
          Interest Report
        </Button>

        <Button
          variant={activeTab === 'expenses' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('expenses')}
          leftIcon={<Wallet className="w-3.5 h-3.5" />}
        >
          Expenses Report
        </Button>

        <Button
          variant={activeTab === 'stamps' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('stamps')}
          leftIcon={<FileSignature className="w-3.5 h-3.5" />}
        >
          Stamps Report
        </Button>

        <Button
          variant={activeTab === 'chits' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('chits')}
          leftIcon={<Coins className="w-3.5 h-3.5" />}
        >
          Chits Report
        </Button>
      </div>

      {/* TAB 1: CUSTOMER SUMMARY */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                Customer Account Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={customerColumns}
                data={reportsData?.customerReports || []}
                emptyText={isLoading ? 'Loading customer statements...' : 'No customer statements found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: INVESTMENT KHATA REPORT */}
      {activeTab === 'investment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Current Investment
              </span>
              <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : formatCurrency(invData?.currentBalance ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Current owner capital</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Investment Interest
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(invData?.investmentInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Capital interest cost</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Loan Interest
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(invData?.loanInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Earned from all loans</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Expenses
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(invData?.expenses ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Operating expenses</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-500" />
                Investment Khata Cash Flow Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={investmentColumns}
                data={invData?.cashFlowReports || []}
                emptyText={isLoading ? 'Loading cash flow transactions...' : 'No cash flow transactions found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: EXPENSES REPORT */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col justify-between border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(expData?.totalExpenses ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total operating expenses in filtered period</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Total Expense Count
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
                {isLoading ? '...' : expData?.totalExpenseCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Vouchers recorded in period</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Top Expense Category
              </span>
              <div className="text-lg font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : expData?.categorySummaries[0]?.category || 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {expData?.categorySummaries[0]
                  ? `${formatCurrency(expData.categorySummaries[0].amount)} (${expData.categorySummaries[0].percentage}%)`
                  : '-'}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-500" />
                Expenses Ledger Vouchers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={expenseColumns}
                data={expData?.expenseReports || []}
                emptyText={isLoading ? 'Loading expense records...' : 'No expense records found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: STAMPS REPORT */}
      {activeTab === 'stamps' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Total Stamp Income
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(stData?.totalStampIncome ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total stamp income collected in filtered period</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Total Stamps Registered
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
                {isLoading ? '...' : stData?.totalStampCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Stamp paper records in period</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Top Customer (Stamp Income)
              </span>
              <div className="text-lg font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : stData?.customerStampSummaries[0]?.customerName || 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stData?.customerStampSummaries[0]
                  ? `${formatCurrency(stData.customerStampSummaries[0].totalIncome)} (${stData.customerStampSummaries[0].percentage}%)`
                  : '-'}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-500" />
                Legal Stamps Income Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={stampColumns}
                data={stData?.stampReports || []}
                emptyText={isLoading ? 'Loading stamp records...' : 'No stamp records found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: CHITS REPORT */}
      {activeTab === 'chits' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Total Chit Payments Paid
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(chitData?.totalPaidAmount ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total chit installment payments in period</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Total Chit Pool Value
              </span>
              <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : formatCurrency(chitData?.totalChitValue ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total pool subscription value across chits</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Installment Vouchers Paid
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
                {isLoading ? '...' : chitData?.totalPaymentsCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Payment receipts recorded in period</p>
            </Card>
          </div>

          {/* Company-wise Breakdown Progress Summary */}
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                Chit Company Portfolio Breakdown
              </h3>
              <Badge variant="outline" className="text-[10px]">
                Distribution
              </Badge>
            </div>

            <div className="space-y-3">
              {(chitData?.companySummaries || []).map((cs) => (
                <div key={cs.chitCompany} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {cs.chitCompany} ({cs.subscriptionsCount} chits)
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Pool: {formatCurrency(cs.totalPoolValue)} | Paid: {formatCurrency(cs.totalPaid)} ({cs.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, cs.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!chitData?.companySummaries || chitData.companySummaries.length === 0) && (
                <p className="text-xs text-slate-400 italic text-center py-4">No chit company data recorded in period.</p>
              )}
            </div>
          </Card>

          {/* Chit Payments Table */}
          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Chit Installment Payment Vouchers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={chitColumns}
                data={chitData?.chitPaymentReports || []}
                emptyText={isLoading ? 'Loading chit payments...' : 'No chit payment records found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 8: INTEREST COLLECTION REPORT */}
      {activeTab === 'interest' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Daily Interest
              </span>
              <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : formatCurrency(intData?.dailyInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Daily loan interest collected</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Weekly Interest
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(intData?.weeklyInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Weekly loan interest collected</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Monthly Interest
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(intData?.monthlyInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Monthly loan interest collected</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <span className="text-xs font-semibold text-[#FF7A00] dark:text-[#FF7A00] uppercase tracking-wider">
                Adjustment Interest
              </span>
              <div className="text-2xl font-bold text-[#FF7A00] dark:text-[#FF7A00] mt-2 truncate">
                {isLoading ? '...' : formatCurrency(intData?.adjustmentInterest ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Adjustment interest collected</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Total Interest Collected
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {isLoading ? '...' : formatCurrency(intData?.totalInterestCollected ?? 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Grand total collected</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-500" />
                Customer Interest Collection Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={interestColumns}
                data={intData?.interestReports || []}
                emptyText={isLoading ? 'Loading interest collection records...' : 'No interest collection records found.'}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

