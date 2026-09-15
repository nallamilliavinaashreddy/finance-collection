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
  Cpu,
  Radio,
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
  const roleBadge = userRole === 'admin' ? 'SYSTEM COMMANDER' : userRole.toUpperCase();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-[#070A12] border-r border-sky-500/20 text-slate-100 transition-all duration-300 ease-out shadow-2xl backdrop-blur-2xl',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* JARVIS Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sky-500/15 shrink-0 bg-slate-900/40">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner shrink-0">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white tracking-wider font-mono">
                  FINCOLLECT
                </span>
              </div>
              <span className="text-[9px] font-mono text-sky-400 font-bold tracking-widest flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sky-500/15 transition-colors border border-transparent hover:border-sky-500/20"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-sky-400" /> : <ChevronLeft className="w-4 h-4 text-sky-400" />}
        </button>
      </div>

      {/* JARVIS Command Links */}
      <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[9px] font-mono font-bold text-sky-500/80 uppercase tracking-widest', isCollapsed && 'sr-only')}>
          <span>[COMMAND MATRIX]</span>
        </div>
        {visibleNavItems.map((item, idx) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const translatedTitle = t(item.translationKey, item.title);
          const indexNum = (idx + 1).toString().padStart(2, '0');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl font-mono text-xs transition-all duration-150 group relative border-l-2',
                isActive
                  ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <span className={cn('text-[10px] font-mono shrink-0', isActive ? 'text-sky-400 font-bold' : 'text-slate-600')}>
                [{indexNum}]
              </span>
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-tight font-sans text-xs">{translatedTitle}</span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-sky-300 text-xs font-mono font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-sky-500/30">
                  [{indexNum}] {translatedTitle}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Command Status Footer */}
      <div className="p-3 border-t border-sky-500/15 shrink-0 bg-slate-900/40">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-900/80 border border-sky-500/20">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate font-sans">{displayName}</span>
              <span className="text-[9px] font-mono text-sky-400 truncate tracking-widest">{roleBadge}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
