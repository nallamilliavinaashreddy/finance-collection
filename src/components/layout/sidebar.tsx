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
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-slate-900 dark:bg-[#0B0F17] border-r border-slate-800 text-slate-100 transition-all duration-300 ease-out shadow-lg',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight font-sans">
                  FinCollect
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Financial SaaS
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest', isCollapsed && 'sr-only')}>
          <span>{t('nav.navigationMenu', 'Main Menu')}</span>
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
                'flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-colors duration-150 group relative border-l-2',
                isActive
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-tight">{translatedTitle}</span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md border border-slate-700">
                  {translatedTitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate">{displayName}</span>
              <span className="text-[10px] text-slate-400 truncate">{roleBadge}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
