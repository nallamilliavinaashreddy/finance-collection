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
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-[#0D172E] backdrop-blur-2xl border-r border-[#1F2D4A] text-[#F8FAFC] transition-all duration-300 ease-in-out shadow-[14px_0_40px_-5px_rgba(0,0,0,0.65)]',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-[#1F2D4A] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-white shadow-lg border-t border-white/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] border-2 border-[#0D172E] rounded-full animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-[#F8FAFC] tracking-tight font-sans">
                  FINCOLLECT
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 rounded-md uppercase shadow-xs">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-[#94A3B8] font-bold tracking-wider uppercase">
                PRO ADMIN OS
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131F37] transition-colors border border-transparent hover:border-[#1F2D4A]"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 flex flex-col gap-1.5 overflow-y-auto">
        <div className={cn('px-3 mb-2 text-[10px] font-extrabold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5', isCollapsed && 'sr-only')}>
          <Sparkles className="w-3 h-3 text-[#3B82F6]" />
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
                'flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 group relative border-l-2 transform-gpu',
                isActive
                  ? 'bg-gradient-to-r from-[#2563EB]/30 via-[#1E3A8A]/20 to-transparent border-[#3B82F6] text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(37,99,235,0.35)] border-t border-t-white/15 translate-z-[6px] -translate-y-0.5'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131F37] hover:translate-x-1 hover:border-l-[#3B82F6]/50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:translate-z-[8px]',
                  isActive ? 'text-[#3B82F6] drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] scale-105' : 'text-[#94A3B8] group-hover:text-[#3B82F6]'
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-wide">{translatedTitle}</span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#131F37] text-[#F8FAFC] text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-2xl border border-[#1F2D4A]">
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
