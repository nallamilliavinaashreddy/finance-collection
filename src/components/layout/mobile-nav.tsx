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

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white dark:bg-[#0D0D0D] border-r border-slate-200 dark:border-[#1E1E1E] z-10 flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF7A00] flex items-center justify-center text-white shadow-md shadow-[#FF7A00]/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                FinCollect
              </span>
              <span className="text-[10px] text-[#FF7A00] font-bold tracking-wider uppercase mt-0.5">
                Pro Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#737373] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const translatedTitle = t(item.translationKey, item.title);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-colors',
                  isActive
                    ? 'bg-[#FF7A00]/10 text-[#FF7A00] font-semibold border-l-2 border-[#FF7A00]'
                    : 'text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#1A1A1A] hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-[#FF7A00]' : 'text-slate-400 dark:text-[#737373]')} />
                <span className="flex-1">{translatedTitle}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1E1E1E] bg-slate-50 dark:bg-[#141414]">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#A3A3A3] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('nav.adminPrivilege', 'Admin Privilege')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
