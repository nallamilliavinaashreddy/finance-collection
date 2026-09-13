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
  Scale,
  Sparkles,
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
  Scale,
  Settings,
};

import { useAuth } from '@/components/providers/auth-provider';
import { getInitials } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();

  const userRole = user?.role || 'admin';
  const visibleNavItems = navigationItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
  );

  const displayName = user?.fullName || (userRole === 'admin' ? 'Administrator' : 'Employee Staff');
  const userInitials = getInitials(displayName);
  const roleBadge = userRole === 'admin' ? 'Administrator' : userRole.toUpperCase();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-white/90 dark:bg-[#070B14]/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-[#F8FAFC] transition-all duration-300 ease-out shadow-xl',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#4F46E5] to-[#3B82F6] flex items-center justify-center text-white shadow-md hover:shadow-indigo-500/30 shrink-0 transition-transform active:scale-95">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#070B14] rounded-full animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight font-sans">
                  FinCollect
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold tracking-wider uppercase">
                Financial SaaS OS
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5', isCollapsed && 'sr-only')}>
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>{t('nav.navigationMenu', 'Main Command Menu')}</span>
        </div>
        {visibleNavItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const translatedTitle = t(item.translationKey, item.title);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all duration-200 group relative border-l-2 transform-gpu active:scale-[0.98]',
                isActive
                  ? 'bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 shadow-xs backdrop-blur-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 hover:translate-x-0.5'
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-tight">{translatedTitle}</span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  {translatedTitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Card */}
      <div className="p-3 border-t border-[#26344D] shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 p-2.5 rounded-2xl bg-[#121A2B] border border-[#26344D]',
            isCollapsed && 'justify-center p-2'
          )}
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#A855F7] to-[#6366F1] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] border-2 border-[#0D1220] rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-xs font-black text-[#F8FAFC] truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-[#22C55E] font-bold truncate flex items-center gap-1 mt-0.5 font-mono">
                <ShieldCheck className="w-3 h-3 text-[#22C55E] shrink-0" />
                {roleBadge}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
