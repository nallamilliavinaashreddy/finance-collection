/**
 * Standardized Year-by-Year Interest Calculation Engine
 * Reusable for Investment Khata, Owner Capital, Withdrawals, and Depositors.
 */

export interface PeriodBreakdown {
  periodNumber: number;
  periodLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isFullYear: boolean;
  elapsedDays: number;
  openingBalance: number;
  annualInterestRate: number;
  interestType: 'simple' | 'compound';
  interestEarned: number;
  closingBalance: number;
  remarks: string;
}

export interface YearlyInterestSummary {
  initialPrincipal: number;
  currentCapital: number;
  totalAccruedInterest: number;
  totalInvestmentValue: number;
  totalCapitalAdded: number;
  totalCapitalWithdrawn: number;
  periods: PeriodBreakdown[];
  startDate: string;
  asOfDate: string;
}

/**
 * Format a Date object to YYYY-MM-DD string in UTC
 */
function toISOFormat(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse YYYY-MM-DD string to Date object in UTC safely
 */
function parseUTCDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) {
    return new Date();
  }
  return new Date(Date.UTC(yyyy, mm, dd));
}

/**
 * Robust transaction date extractor supporting property variations
 */
function getTxDate(t: any): string {
  const raw = t.transaction_date || t.transactionDate || t.created_at || t.createdAt;
  if (!raw) return toISOFormat(new Date());
  return String(raw).trim().split('T')[0].split(' ')[0];
}

/**
 * Calculate Year-by-Year Interest Breakdown from historical transaction start date up to current date
 */
export function calculateYearlyBreakdown(
  transactions: any[],
  annualRate: number,
  interestType: 'simple' | 'compound',
  asOfDateStr?: string
): YearlyInterestSummary {
  const todayISO = asOfDateStr || toISOFormat(new Date());
  const todayDate = parseUTCDate(todayISO);

  // Filter capital additions
  const capitalTxList = transactions.filter(
    (t) =>
      (t.transaction_type === 'Capital Added' ||
        t.transactionType === 'Capital Added' ||
        t.transaction_type === 'Chit Prize Received' ||
        t.transactionType === 'Chit Prize Received' ||
        t.transaction_type === 'Deposit Received' ||
        t.transactionType === 'Deposit Received' ||
        t.transaction_type === 'Withdrawal Return' ||
        t.transactionType === 'Withdrawal Return') &&
      Number(t.amount_in || t.amountIn || 0) > 0
  );

  // Filter capital withdrawals
  const withdrawalsList = transactions.filter(
    (t) =>
      (t.transaction_type === 'Business Withdrawal' ||
        t.transactionType === 'Business Withdrawal' ||
        t.transaction_type === 'Capital Returned' ||
        t.transactionType === 'Capital Returned') &&
      Number(t.amount_out || t.amountOut || 0) > 0
  );

  const totalCapitalAdded = capitalTxList.reduce(
    (sum, t) => sum + Number(t.amount_in || t.amountIn || 0),
    0
  );
  const totalCapitalWithdrawn = withdrawalsList.reduce(
    (sum, t) => sum + Number(t.amount_out || t.amountOut || 0),
    0
  );
  const currentCapital = Math.max(0, totalCapitalAdded - totalCapitalWithdrawn);

  // If no capital transactions exist, return zero summary
  if (capitalTxList.length === 0) {
    return {
      initialPrincipal: 0,
      currentCapital: 0,
      totalAccruedInterest: 0,
      totalInvestmentValue: 0,
      totalCapitalAdded: 0,
      totalCapitalWithdrawn: 0,
      periods: [],
      startDate: todayISO,
      asOfDate: todayISO,
    };
  }

  // Sort capital transactions chronologically by actual transaction date
  const sortedCapitalTx = [...capitalTxList].sort((a, b) => {
    return parseUTCDate(getTxDate(a)).getTime() - parseUTCDate(getTxDate(b)).getTime();
  });

  const firstCapDateStr = getTxDate(sortedCapitalTx[0]);
  const startDate = parseUTCDate(firstCapDateStr);

  // Helper to compute active net principal added up to a specific date
  const getActiveNetPrincipalAsOf = (asOfDate: Date): number => {
    const added = capitalTxList
      .filter((t) => parseUTCDate(getTxDate(t)) <= asOfDate)
      .reduce((sum, t) => sum + Number(t.amount_in || t.amountIn || 0), 0);

    const withdrawn = withdrawalsList
      .filter((t) => parseUTCDate(getTxDate(t)) <= asOfDate)
      .reduce((sum, t) => sum + Number(t.amount_out || t.amountOut || 0), 0);

    return Math.max(0, added - withdrawn);
  };

  // Combine all capital transaction dates for sub-interval event tracking
  const allTxDates = [...capitalTxList, ...withdrawalsList]
    .map((t) => parseUTCDate(getTxDate(t)))
    .sort((a, b) => a.getTime() - b.getTime());

  // Generate Year-by-Year Periods starting from the ORIGINAL historical transaction date
  const periods: PeriodBreakdown[] = [];
  let periodStart = new Date(startDate.getTime());
  let periodIndex = 1;
  let accumulatedInterestCompounded = 0; // Cumulative interest added to principal for compound interest
  let totalAccruedInterest = 0;

  while (periodStart < todayDate) {
    // Next anniversary date (1 year later)
    const nextAnniversary = new Date(periodStart.getTime());
    nextAnniversary.setUTCFullYear(nextAnniversary.getUTCFullYear() + 1);

    const isFullYear = nextAnniversary <= todayDate;
    const periodEnd = isFullYear ? nextAnniversary : new Date(todayDate.getTime());

    const periodStartISO = toISOFormat(periodStart);
    const periodEndISO = toISOFormat(periodEnd);

    const elapsedDays = Math.max(
      0,
      Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (elapsedDays === 0) {
      break;
    }

    const netActivePrincipalAtStart = getActiveNetPrincipalAsOf(periodStart);
    const openingBalance =
      interestType === 'compound'
        ? Math.round((netActivePrincipalAtStart + accumulatedInterestCompounded) * 100) / 100
        : Math.round(netActivePrincipalAtStart * 100) / 100;

    // Collect all sub-interval boundary dates within [periodStart, periodEnd]
    const subIntervalDates: Date[] = [periodStart];
    for (const d of allTxDates) {
      if (d > periodStart && d < periodEnd) {
        subIntervalDates.push(d);
      }
    }
    subIntervalDates.push(periodEnd);

    let periodInterest = 0;
    const hasIntraPeriodEvents = subIntervalDates.length > 2;

    if (isFullYear && !hasIntraPeriodEvents) {
      // Full Completed Year with no intra-year transactions: Exact annual rate (e.g. 18%)
      periodInterest = openingBalance * (annualRate / 100);
    } else if (!isFullYear && !hasIntraPeriodEvents) {
      // Partial Period with no intra-period transactions
      const elapsedYears = elapsedDays / 365.0;
      if (interestType === 'compound') {
        periodInterest = openingBalance * (Math.pow(1 + annualRate / 100, elapsedYears) - 1);
      } else {
        periodInterest = openingBalance * (annualRate / 100) * elapsedYears;
      }
    } else {
      // Intra-period transactions exist: Calculate across sub-intervals
      for (let i = 0; i < subIntervalDates.length - 1; i++) {
        const subStart = subIntervalDates[i];
        const subEnd = subIntervalDates[i + 1];

        const subDays = Math.max(
          0,
          Math.floor((subEnd.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24))
        );

        if (subDays > 0) {
          const activeNetCapitalAtSubStart = getActiveNetPrincipalAsOf(subStart);
          const subBaseBalance =
            interestType === 'compound'
              ? activeNetCapitalAtSubStart + accumulatedInterestCompounded
              : activeNetCapitalAtSubStart;

          if (isFullYear) {
            const subInterest = subBaseBalance * (annualRate / 100) * (subDays / 365.0);
            periodInterest += subInterest;
          } else {
            const subYears = subDays / 365.0;
            if (interestType === 'compound') {
              const subInterest = subBaseBalance * (Math.pow(1 + annualRate / 100, subYears) - 1);
              periodInterest += subInterest;
            } else {
              const subInterest = subBaseBalance * (annualRate / 100) * subYears;
              periodInterest += subInterest;
            }
          }
        }
      }
    }

    const roundedPeriodInterest = Math.round(periodInterest * 100) / 100;
    totalAccruedInterest += roundedPeriodInterest;

    if (interestType === 'compound') {
      accumulatedInterestCompounded += roundedPeriodInterest;
    }

    const netActivePrincipalAtEnd = getActiveNetPrincipalAsOf(periodEnd);
    const closingBalance =
      interestType === 'compound'
        ? Math.round((netActivePrincipalAtEnd + accumulatedInterestCompounded) * 100) / 100
        : Math.round(netActivePrincipalAtEnd * 100) / 100;

    const label = isFullYear
      ? `Year ${periodIndex} (${periodStartISO} → ${periodEndISO})`
      : `Partial Period (${periodStartISO} → ${periodEndISO})`;

    periods.push({
      periodNumber: periodIndex,
      periodLabel: label,
      startDate: periodStartISO,
      endDate: periodEndISO,
      isFullYear,
      elapsedDays,
      openingBalance,
      annualInterestRate: annualRate,
      interestType,
      interestEarned: roundedPeriodInterest,
      closingBalance,
      remarks: `Annual ${interestType === 'compound' ? 'Compound' : 'Simple'} Interest @ ${annualRate}%/year`,
    });

    periodStart = periodEnd;
    periodIndex++;
  }

  const roundedTotalInterest = Math.round(totalAccruedInterest * 100) / 100;
  const initialPrincipal = Number(sortedCapitalTx[0].amount_in || sortedCapitalTx[0].amountIn || 0);

  return {
    initialPrincipal,
    currentCapital: Math.round(currentCapital * 100) / 100,
    totalAccruedInterest: roundedTotalInterest,
    totalInvestmentValue: Math.round((currentCapital + roundedTotalInterest) * 100) / 100,
    totalCapitalAdded: Math.round(totalCapitalAdded * 100) / 100,
    totalCapitalWithdrawn: Math.round(totalCapitalWithdrawn * 100) / 100,
    periods,
    startDate: firstCapDateStr,
    asOfDate: todayISO,
  };
}
