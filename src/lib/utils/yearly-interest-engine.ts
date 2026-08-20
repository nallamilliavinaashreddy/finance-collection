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
 * Parse YYYY-MM-DD string to Date object in UTC
 */
function parseUTCDate(dateStr: string): Date {
  const parts = dateStr.trim().split('-');
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  return new Date(Date.UTC(yyyy, mm, dd));
}

/**
 * Calculate Year-by-Year Interest Breakdown
 */
export function calculateYearlyBreakdown(
  transactions: {
    transaction_date: string;
    transaction_type: string;
    amount_in?: number;
    amount_out?: number;
  }[],
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
        t.transaction_type === 'Chit Prize Received' ||
        t.transaction_type === 'Deposit Received' ||
        t.transaction_type === 'Withdrawal Return') &&
      Number(t.amount_in || 0) > 0
  );

  // Filter capital withdrawals
  const withdrawalsList = transactions.filter(
    (t) =>
      (t.transaction_type === 'Business Withdrawal' ||
        t.transaction_type === 'Capital Returned') &&
      Number(t.amount_out || 0) > 0
  );

  const totalCapitalAdded = capitalTxList.reduce((sum, t) => sum + Number(t.amount_in || 0), 0);
  const totalCapitalWithdrawn = withdrawalsList.reduce((sum, t) => sum + Number(t.amount_out || 0), 0);
  const currentCapital = Math.max(0, totalCapitalAdded - totalCapitalWithdrawn);

  // If no transactions exist, return empty summary
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

  // Sort capital transactions chronologically
  const sortedCapitalTx = [...capitalTxList].sort((a, b) => {
    return parseUTCDate(a.transaction_date).getTime() - parseUTCDate(b.transaction_date).getTime();
  });

  const firstCapDateStr = sortedCapitalTx[0].transaction_date || todayISO;
  const startDate = parseUTCDate(firstCapDateStr);

  // Generate Year-by-Year Periods
  const periods: PeriodBreakdown[] = [];
  let periodStart = new Date(startDate.getTime());
  let periodIndex = 1;
  let runningPrincipal = currentCapital;
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

    const openingBalance = Math.round(runningPrincipal * 100) / 100;
    let interestEarned = 0;

    if (isFullYear) {
      // Full Completed Year: Simple = P * (R / 100), Compound = P * (R / 100)
      interestEarned = Math.round((openingBalance * (annualRate / 100)) * 100) / 100;
    } else {
      // Partial Year Period
      const elapsedYears = elapsedDays / 365.0;
      if (interestType === 'compound') {
        const compoundAmt = openingBalance * Math.pow(1 + annualRate / 100, elapsedYears);
        interestEarned = Math.round((compoundAmt - openingBalance) * 100) / 100;
      } else {
        interestEarned = Math.round((openingBalance * (annualRate / 100) * elapsedYears) * 100) / 100;
      }
    }

    totalAccruedInterest += interestEarned;
    const closingBalance =
      interestType === 'compound'
        ? Math.round((openingBalance + interestEarned) * 100) / 100
        : openingBalance;

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
      interestEarned,
      closingBalance,
      remarks: `Annual ${interestType === 'compound' ? 'Compound' : 'Simple'} Interest @ ${annualRate}%/year`,
    });

    if (interestType === 'compound') {
      runningPrincipal = closingBalance;
    }

    periodStart = periodEnd;
    periodIndex++;
  }

  const roundedTotalInterest = Math.round(totalAccruedInterest * 100) / 100;

  return {
    initialPrincipal: Number(sortedCapitalTx[0].amount_in || 0),
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
