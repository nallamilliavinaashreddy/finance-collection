'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/config/navigation';
import { useLanguage } from '@/i18n/language-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Landmark,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  FileSignature,
  Coins,
  PiggyBank,
  Percent,
  Handshake,
  BookOpen,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  PiggyBank,
  Users,
  Landmark,
  Receipt,
  BookOpen,
  Percent,
  Wallet,
  FileSignature,
  Coins,
  Handshake,
  BarChart3,
  Settings,
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-white/80 dark:bg-[#0D0D0D]/85 backdrop-blur-xl border-r border-slate-200/80 dark:border-[#1E1E1E]/80 transition-all duration-300 ease-in-out shadow-xl',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-[#1E1E1E]/80 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[#FF7A00]/25 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                FinCollect
              </span>
              <span className="text-[10px] text-[#FF7A00] font-bold tracking-wider uppercase mt-0.5">
                Pro Admin
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 dark:text-[#737373] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 flex flex-col gap-1.5 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[11px] font-semibold text-slate-500 dark:text-[#737373] uppercase tracking-wider', isCollapsed && 'sr-only')}>
          {t('nav.navigationMenu', 'Navigation Menu')}
        </div>
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const translatedTitle = t(item.translationKey, item.title);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative',
                isActive
                  ? 'bg-[#FF7A00]/15 text-[#FF7A00] font-bold border-l-2 border-[#FF7A00] shadow-sm shadow-[#FF7A00]/10 dark:shadow-[#FF7A00]/20'
                  : 'text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#1A1A1A]/80'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-[#FF7A00]'
                    : 'text-slate-400 dark:text-[#737373] group-hover:text-slate-900 dark:group-hover:text-white'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{translatedTitle}</span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 dark:bg-[#141414] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-slate-700 dark:border-[#262626]">
                  {translatedTitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Preview */}
      <div className="p-3 border-t border-slate-200/80 dark:border-[#1E1E1E]/80 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 dark:bg-[#141414]/80 border border-slate-200/80 dark:border-[#262626]/80 backdrop-blur-md',
            isCollapsed && 'justify-center p-2'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center font-bold text-xs shrink-0">
            AD
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                Admin Owner
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#A3A3A3] truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Live PostgreSQL
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
