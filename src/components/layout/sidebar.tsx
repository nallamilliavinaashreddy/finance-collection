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
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-[#0B0F17]/95 dark:bg-[#070A0F]/95 backdrop-blur-2xl border-r border-slate-800/80 dark:border-[#1E293B]/80 text-white transition-all duration-300 ease-in-out shadow-2xl',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F97316] via-[#FF7A00] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-[#F97316]/40 shrink-0 ring-2 ring-[#F97316]/30">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0B0F17] rounded-full animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-white tracking-tight font-sans">
                  FinCollect
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40 rounded-md uppercase">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                Financial SaaS OS
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5', isCollapsed && 'sr-only')}>
          <Sparkles className="w-3 h-3 text-[#F97316]" />
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
                'flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-lg shadow-[#F97316]/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-wide">{translatedTitle}</span>
              )}

              {/* Active Indicator Glow Pill */}
              {isActive && !isCollapsed && (
                <div className="w-1.5 h-4 rounded-full bg-white ml-auto shadow-xs" />
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-2xl border border-slate-700">
                  {translatedTitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Card */}
      <div className="p-3 border-t border-slate-800/80 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl',
            isCollapsed && 'justify-center p-2'
          )}
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F97316] to-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B0F17] rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-xs font-black text-white truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold truncate flex items-center gap-1 mt-0.5 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                {roleBadge}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
