'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { getDayBookData, saveDailyCashClosure, recordTransactionReversal } from '@/lib/actions/day-book';
import { DayBookData, DayBookEntry } from '@/types';

export default function DayBookPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<DayBookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [cashTypeFilter, setCashTypeFilter] = useState<string>('all');

  // Modals
  const [showClosureModal, setShowClosureModal] = useState<boolean>(false);
  const [physicalCashInput, setPhysicalCashInput] = useState<string>('');
  const [closureNotes, setClosureNotes] = useState<string>('');
  const [isSavingClosure, setIsSavingClosure] = useState<boolean>(false);

  const [reversalTarget, setReversalTarget] = useState<DayBookEntry | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [isSavingReversal, setIsSavingReversal] = useState<boolean>(false);

  const loadData = async (dateStr: string) => {
    setLoading(true);
    const res = await getDayBookData(dateStr);
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.cashManagement.actualPhysicalCash !== undefined) {
        setPhysicalCashInput(String(res.data.cashManagement.actualPhysicalCash));
      } else {
        setPhysicalCashInput('');
      }
      setClosureNotes(res.data.cashManagement.notes || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
  };

  const handleSaveClosure = async () => {
    const num = parseFloat(physicalCashInput);
    if (isNaN(num) || num < 0) {
      alert('Please enter a valid physical cash amount.');
      return;
    }

    setIsSavingClosure(true);
    const res = await saveDailyCashClosure({
      closureDate: selectedDate,
      actualPhysicalCash: num,
      notes: closureNotes,
    });
    setIsSavingClosure(false);

    if (res.success) {
      setShowClosureModal(false);
      loadData(selectedDate);
    } else {
      alert(res.error || 'Failed to save cash closure');
    }
  };

  const handleSaveReversal = async () => {
    if (!reversalTarget) return;
    if (!reversalReason.trim()) {
      alert('Please provide a reason for reversal.');
      return;
    }

    setIsSavingReversal(true);
    const isCashIn = reversalTarget.cashIn > 0;
    const reversalType = isCashIn ? 'cash_out' : 'cash_in';
    const amount = isCashIn ? reversalTarget.cashIn : reversalTarget.cashOut;

    const res = await recordTransactionReversal({
      sourceModule: reversalTarget.sourceModule,
      sourceTransactionId: reversalTarget.sourceTransactionId,
      reversalType,
      reversalAmount: amount,
      reason: reversalReason,
    });
    setIsSavingReversal(false);

    if (res.success) {
      setReversalTarget(null);
      setReversalReason('');
      loadData(selectedDate);
    } else {
      alert(res.error || 'Failed to record reversal');
    }
  };

  // Filter entries
  const filteredEntries = (data?.entries || []).filter((entry) => {
    if (moduleFilter !== 'all' && entry.sourceModule !== moduleFilter) return false;
    if (cashTypeFilter === 'in' && entry.cashIn <= 0) return false;
    if (cashTypeFilter === 'out' && entry.cashOut <= 0) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return (
        entry.customerOrAccountName.toLowerCase().includes(q) ||
        entry.transactionType.toLowerCase().includes(q) ||
        (entry.loanOrRefCode && entry.loanOrRefCode.toLowerCase().includes(q)) ||
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        entry.sourceTransactionId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const cm = data?.cashManagement;
  const cs = data?.collectionSummary;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141414] p-5 rounded-2xl border border-[#262626]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#FF7A00]" />
            Day Book & Cash Management
          </h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Real-time unified cash ledger, daily collection totals, and physical cash reconciliation.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-[#1F1F1F] p-1.5 rounded-xl border border-[#333333]">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-lg border border-[#333333]">
            <CalendarIcon className="w-4 h-4 text-[#FF7A00]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs font-semibold bg-[#FF7A00]/10 text-[#FF7A00] hover:bg-[#FF7A00]/20 rounded-lg transition-colors border border-[#FF7A00]/30"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 1. Daily Collection Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">Daily Collection</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.dailyCollection || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">Weekly Collection</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.weeklyCollection || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">Monthly Interest</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.monthlyInterest || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">Monthly Principal</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.monthlyPrincipal || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">EMI Collection</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.emiCollection || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#141414] p-3.5 rounded-xl border border-[#262626]">
          <span className="text-[11px] font-medium text-[#A3A3A3] block uppercase tracking-wider">Other Collections</span>
          <span className="text-lg font-bold text-white mt-1 block">
            ₹{(cs?.otherCollection || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#FF7A00]/10 p-3.5 rounded-xl border border-[#FF7A00]/30 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-[#FF7A00] block uppercase tracking-wider">Total Collection</span>
          <span className="text-xl font-black text-[#FF7A00] mt-1 block">
            ₹{(cs?.totalCollection || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 2. Cash Management Summary & Physical Reconciliation Card */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-[#262626] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#262626] flex items-center justify-center text-[#FF7A00]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cash Management Summary</h2>
              <p className="text-xs text-[#A3A3A3]">
                Opening Balance + Cash In - Cash Out = Expected Closing Cash
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowClosureModal(true)}
            className="px-4 py-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#FF7A00]/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {cm?.isClosed ? 'Update Physical Closure' : 'Reconcile Physical Cash'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
            <span className="text-xs font-medium text-[#A3A3A3] block">Opening Cash</span>
            <span className="text-xl font-bold text-white mt-1 block">
              ₹{(cm?.openingCash || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
            <span className="text-xs font-medium text-[#22C55E] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Cash In (+)
            </span>
            <span className="text-xl font-bold text-[#22C55E] mt-1 block">
              ₹{(cm?.totalCashIn || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
            <span className="text-xs font-medium text-[#EF4444] flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Total Cash Out (-)
            </span>
            <span className="text-xl font-bold text-[#EF4444] mt-1 block">
              ₹{(cm?.totalCashOut || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
            <span className="text-xs font-medium text-[#3B82F6] block">Expected Closing Cash</span>
            <span className="text-xl font-bold text-[#3B82F6] mt-1 block">
              ₹{(cm?.expectedClosingCash || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
            <span className="text-xs font-medium text-[#A3A3A3] block">Actual Physical Cash</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {cm?.actualPhysicalCash !== undefined
                ? `₹${cm.actualPhysicalCash.toLocaleString('en-IN')}`
                : 'Not Reconciled'}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              cm?.cashDifference === undefined
                ? 'bg-[#1A1A1A] border-[#262626]'
                : cm.cashDifference === 0
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30'
                : cm.cashDifference < 0
                ? 'bg-[#EF4444]/10 border-[#EF4444]/30'
                : 'bg-[#EAB308]/10 border-[#EAB308]/30'
            }`}
          >
            <span className="text-xs font-medium block">
              {cm?.cashDifference === undefined
                ? 'Status'
                : cm.cashDifference === 0
                ? 'Balanced (₹0)'
                : cm.cashDifference < 0
                ? 'Shortage (-)'
                : 'Excess (+)'}
            </span>
            <span
              className={`text-xl font-extrabold mt-1 block ${
                cm?.cashDifference === undefined
                  ? 'text-[#A3A3A3]'
                  : cm.cashDifference === 0
                  ? 'text-[#22C55E]'
                  : cm.cashDifference < 0
                  ? 'text-[#EF4444]'
                  : 'text-[#EAB308]'
              }`}
            >
              {cm?.cashDifference !== undefined
                ? `₹${Math.abs(cm.cashDifference).toLocaleString('en-IN')}`
                : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Day Book Table */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-[#262626] space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <h3 className="text-lg font-bold text-white">Day Book Transactions</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#262626] text-[#A3A3A3] rounded-full">
              {filteredEntries.length} Records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                placeholder="Search transaction, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-sm pl-9 pr-4 py-2 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-[#1A1A1A] text-white text-sm px-3 py-2 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
            >
              <option value="all">All Modules</option>
              <option value="daily_finance">Daily Finance</option>
              <option value="weekly_finance">Weekly Finance</option>
              <option value="monthly_finance">Monthly Finance</option>
              <option value="loan_disbursement">Loan Disbursements</option>
              <option value="expense">Expenses</option>
              <option value="investment">Investment & Owner</option>
              <option value="depositor">Depositors</option>
              <option value="reversal">Reversals</option>
            </select>

            {/* Cash Type Filter */}
            <select
              value={cashTypeFilter}
              onChange={(e) => setCashTypeFilter(e.target.value)}
              className="bg-[#1A1A1A] text-white text-sm px-3 py-2 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
            >
              <option value="all">All Cash Flows</option>
              <option value="in">Cash In (+)</option>
              <option value="out">Cash Out (-)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#262626]">
          <table className="w-full text-left text-sm text-[#D4D4D4]">
            <thead className="bg-[#1A1A1A] text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider border-b border-[#262626]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer / Account</th>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right text-[#22C55E]">Cash In (+)</th>
                <th className="py-3 px-4 text-right text-[#EF4444]">Cash Out (-)</th>
                <th className="py-3 px-4 text-right text-[#3B82F6]">Balance</th>
                <th className="py-3 px-4 text-center">User</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] bg-[#141414]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#737373]">
                    Loading Day Book transactions...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#737373]">
                    No transactions recorded for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-[#1A1A1A]/80 transition-colors ${
                      entry.isReversal ? 'bg-[#EF4444]/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-[#A3A3A3]">
                      {entry.transactionTime}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-white">
                      <span className="inline-flex items-center gap-1.5">
                        {entry.isReversal && <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />}
                        {entry.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-white font-semibold">
                      {entry.customerOrAccountName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-[#A3A3A3] font-mono">
                      {entry.loanOrRefCode || '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-xs text-[#A3A3A3]">
                      {entry.description || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-[#22C55E]">
                      {entry.cashIn > 0 ? `+₹${entry.cashIn.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-[#EF4444]">
                      {entry.cashOut > 0 ? `-₹${entry.cashOut.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-[#3B82F6]">
                      ₹{entry.runningBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center text-xs text-[#A3A3A3]">
                      {entry.collectorOrUser}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {!entry.isReversal && (
                        <button
                          onClick={() => setReversalTarget(entry)}
                          className="px-2 py-1 text-[11px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 rounded border border-[#EF4444]/30 transition-colors"
                          title="Record Reversal / Correction"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Physical Cash Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#FF7A00]" />
              Reconcile Physical Cash ({selectedDate})
            </h3>

            <div className="space-y-3 text-sm text-[#D4D4D4]">
              <div className="flex justify-between py-2 border-b border-[#262626]">
                <span className="text-[#A3A3A3]">Expected Closing Cash:</span>
                <span className="font-bold text-white">
                  ₹{(cm?.expectedClosingCash || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
                  Actual Physical Cash Count (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter physical cash in drawer"
                  value={physicalCashInput}
                  onChange={(e) => setPhysicalCashInput(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white text-lg font-bold px-4 py-2.5 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              {physicalCashInput !== '' && !isNaN(parseFloat(physicalCashInput)) && (
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#262626] flex justify-between items-center">
                  <span className="text-xs text-[#A3A3A3]">Calculated Difference:</span>
                  <span
                    className={`font-extrabold text-base ${
                      parseFloat(physicalCashInput) - (cm?.expectedClosingCash || 0) === 0
                        ? 'text-[#22C55E]'
                        : parseFloat(physicalCashInput) - (cm?.expectedClosingCash || 0) < 0
                        ? 'text-[#EF4444]'
                        : 'text-[#EAB308]'
                    }`}
                  >
                    ₹
                    {(
                      parseFloat(physicalCashInput) - (cm?.expectedClosingCash || 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
                  Notes / Audit Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for shortage or excess..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white text-sm px-4 py-2 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClosureModal(false)}
                className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClosure}
                disabled={isSavingClosure}
                className="px-5 py-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-[#FF7A00]/20 disabled:opacity-50"
              >
                {isSavingClosure ? 'Saving...' : 'Confirm Closure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reversal Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-[#EF4444]" />
              Record Transaction Reversal
            </h3>

            <div className="p-3 bg-[#1A1A1A] rounded-xl border border-[#262626] space-y-1 text-xs text-[#A3A3A3]">
              <p>
                <strong className="text-white">Transaction:</strong> {reversalTarget.transactionType}
              </p>
              <p>
                <strong className="text-white">Customer / Account:</strong>{' '}
                {reversalTarget.customerOrAccountName}
              </p>
              <p>
                <strong className="text-white">Amount:</strong> ₹
                {(reversalTarget.cashIn || reversalTarget.cashOut).toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">
                Reversal Reason (Required)
              </label>
              <textarea
                rows={3}
                placeholder="Specify exact reason for entry correction..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-sm px-4 py-2.5 rounded-xl border border-[#262626] focus:outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReversalTarget(null)}
                className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReversal}
                disabled={isSavingReversal}
                className="px-5 py-2 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-[#EF4444]/20 disabled:opacity-50"
              >
                {isSavingReversal ? 'Recording...' : 'Record Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
