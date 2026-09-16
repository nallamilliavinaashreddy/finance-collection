'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/language-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Landmark,
  Receipt,
  Grid,
} from 'lucide-react';

interface BottomNavProps {
  onOpenMore: () => void;
}

export function BottomNav({ onOpenMore }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const mainNavItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      labelKey: 'nav.dashboard',
      fallback: 'Home',
    },
    {
      href: '/customers',
      icon: Users,
      labelKey: 'nav.customers',
      fallback: 'Customers',
    },
    {
      href: '/loans',
      icon: Landmark,
      labelKey: 'nav.loans',
      fallback: 'Loans',
    },
    {
      href: '/collections',
      icon: Receipt,
      labelKey: 'nav.collections',
      fallback: 'Collections',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center justify-around px-2 md:hidden">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
        const label = t(item.labelKey, item.fallback);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors gap-0.5',
              isActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div className={cn('p-1 rounded-xl transition-all', isActive && 'bg-sky-500/10')}>
              <Icon className={cn('w-5 h-5', isActive ? 'text-sky-400' : 'text-slate-400')} />
            </div>
            <span className="truncate max-w-[64px]">{label}</span>
          </Link>
        );
      })}

      {/* More Drawer Launcher */}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors gap-0.5"
      >
        <div className="p-1 rounded-xl">
          <Grid className="w-5 h-5 text-slate-400" />
        </div>
        <span>{t('nav.more', 'More')}</span>
      </button>
    </nav>
  );
}
