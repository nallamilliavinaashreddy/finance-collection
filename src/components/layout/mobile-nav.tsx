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
  X,
  TrendingUp,
  ShieldCheck,
  PiggyBank,
  Percent,
  Wallet,
  FileSignature,
  Coins,
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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!isOpen) return null;

  const userRole = user?.role || 'admin';
  const visibleNavItems = navigationItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
  );

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-slate-900 dark:bg-[#0B0F17] border-r border-slate-800 z-10 flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-white tracking-tight">
                FinCollect
              </span>
              <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase mt-0.5">
                Pro Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 px-3 flex flex-col gap-4 overflow-y-auto">
          {/* Primary Modules */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">
              Core Modules
            </span>
            {visibleNavItems
              .filter((i) => ['/dashboard', '/customers', '/loans', '/collections'].includes(i.href))
              .map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                const translatedTitle = t(item.translationKey, item.title);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors border-l-2',
                      isActive
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                    <span className="flex-1">{translatedTitle}</span>
                  </Link>
                );
              })}
          </div>

          {/* More Financial & Management Modules */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">
              More Financial Modules
            </span>
            {visibleNavItems
              .filter((i) => !['/dashboard', '/customers', '/loans', '/collections'].includes(i.href))
              .map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const translatedTitle = t(item.translationKey, item.title);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors border-l-2',
                      isActive
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                    <span className="flex-1">{translatedTitle}</span>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('nav.adminPrivilege', 'Admin Privilege')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
