import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats amount in Indian Rupee (₹) format using 'en-IN' locale.
 * Example: ₹10,000, ₹8,500, ₹1,25,000
 */
export function formatCurrency(amount: number, maximumFractionDigits: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: maximumFractionDigits,
  }).format(amount || 0);
}

export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';
  let d: Date;
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      d = new Date(`${trimmed}T00:00:00`);
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getInitials(name: string): string {
  if (!name) return 'AD';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * DAILY LOANS: Calculates End Date by adding N working days starting from Start Date, skipping all Sundays.
 */
export function calculateEndDateSkippingSundays(startDateStr: string, workingDays: number = 100): string {
  if (!startDateStr || isNaN(workingDays) || workingDays <= 0) return '';
  const current = new Date(`${startDateStr}T00:00:00`);
  if (isNaN(current.getTime())) return '';

  let daysAdded = 0;
  while (daysAdded < workingDays) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() !== 0) { // 0 is Sunday
      daysAdded++;
    }
  }

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * WEEKLY LOANS: Calculates End Date by adding N collection weeks starting from Start Date.
 */
export function calculateWeeklyEndDate(startDateStr: string, totalWeeks: number = 10): string {
  if (!startDateStr || isNaN(totalWeeks) || totalWeeks <= 0) return '';
  const current = new Date(`${startDateStr}T00:00:00`);
  if (isNaN(current.getTime())) return '';

  current.setDate(current.getDate() + totalWeeks * 7);

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * MONTHLY LOANS: Calculates End Date by adding N months starting from Start Date.
 */
export function calculateMonthlyEndDate(startDateStr: string, totalMonths: number = 6): string {
  if (!startDateStr || isNaN(totalMonths) || totalMonths <= 0) return '';
  const current = new Date(`${startDateStr}T00:00:00`);
  if (isNaN(current.getTime())) return '';

  current.setMonth(current.getMonth() + totalMonths);

  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * DAILY LOANS: Auto calculates Daily Amount = Total Collection Amount / Working Days
 */
export function calculateDailyAmount(totalCollectionAmount: number, workingDays: number = 100): number {
  if (!totalCollectionAmount || isNaN(totalCollectionAmount) || !workingDays || workingDays <= 0) return 0;
  const result = totalCollectionAmount / workingDays;
  return Math.round(result * 100) / 100;
}

/**
 * WEEKLY LOANS: Auto calculates Weekly Amount = Total Collection Amount / Total Weeks
 */
export function calculateWeeklyAmount(totalCollectionAmount: number, totalWeeks: number = 10): number {
  if (!totalCollectionAmount || isNaN(totalCollectionAmount) || !totalWeeks || totalWeeks <= 0) return 0;
  const result = totalCollectionAmount / totalWeeks;
  return Math.round(result * 100) / 100;
}

/**
 * MONTHLY LOANS: Auto calculates Monthly Amount = Total Collection Amount / Total Months
 */
export function calculateMonthlyAmount(totalCollectionAmount: number, totalMonths: number = 6): number {
  if (!totalCollectionAmount || isNaN(totalCollectionAmount) || !totalMonths || totalMonths <= 0) return 0;
  const result = totalCollectionAmount / totalMonths;
  return Math.round(result * 100) / 100;
}

/**
 * WEEKLY LOANS: Returns Monday (weekStart) and Sunday (weekEnd) dates for any payment date.
 */
export function getWeekDateRange(dateStr: string): { weekStart: string; weekEnd: string } {
  if (!dateStr) return { weekStart: '', weekEnd: '' };
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return { weekStart: '', weekEnd: '' };

  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toIso = (dt: Date) => {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return { weekStart: toIso(monday), weekEnd: toIso(sunday) };
}

/**
 * MONTHLY LOANS: Returns 1st of month (monthStart) and last day of month (monthEnd) for any payment date.
 */
export function getMonthDateRange(dateStr: string): { monthStart: string; monthEnd: string } {
  if (!dateStr) return { monthStart: '', monthEnd: '' };
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return { monthStart: '', monthEnd: '' };

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const lastDayNum = new Date(yyyy, d.getMonth() + 1, 0).getDate();
  const lastDd = String(lastDayNum).padStart(2, '0');

  return {
    monthStart: `${yyyy}-${mm}-01`,
    monthEnd: `${yyyy}-${mm}-${lastDd}`,
  };
}
