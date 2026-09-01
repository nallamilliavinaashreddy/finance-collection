import { getWeekDateRange, getMonthDateRange, formatDate } from '@/lib/utils';

export interface AIDateBounds {
  todayISO: string;
  weekStartISO: string;
  weekEndISO: string;
  monthStartISO: string;
  monthEndISO: string;
  businessTimezone: string;
}

/**
 * Centralized, Authoritative Date Range Calculator for FinCollect AI Assistant
 */
export function getLocalTodayISO(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getAIDateBounds(dateISO?: string): AIDateBounds {
  const targetISO = dateISO || getLocalTodayISO();
  const { weekStart, weekEnd } = getWeekDateRange(targetISO);
  const { monthStart, monthEnd } = getMonthDateRange(targetISO);

  return {
    todayISO: targetISO,
    weekStartISO: weekStart,
    weekEndISO: weekEnd,
    monthStartISO: monthStart,
    monthEndISO: monthEnd,
    businessTimezone: 'Asia/Kolkata (IST)',
  };
}

export function formatRangeLabel(startISO: string, endISO: string): string {
  return `${formatDate(startISO)} – ${formatDate(endISO)}`;
}
