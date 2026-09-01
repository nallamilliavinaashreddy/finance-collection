'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  UserPlus,
  Landmark,
  Receipt,
  Wallet,
  PiggyBank,
  Zap,
} from 'lucide-react';

export function QuickActionsBar() {
  const actions = [
    {
      label: 'Add Customer',
      href: '/customers',
      icon: UserPlus,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500',
    },
    {
      label: 'Create Loan',
      href: '/loans',
      icon: Landmark,
      color: 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20 hover:bg-[#FF7A00] hover:text-white',
    },
    {
      label: 'Record Collection',
      href: '/collections',
      icon: Receipt,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500',
    },
    {
      label: 'Add Expense',
      href: '/expenses',
      icon: Wallet,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500',
    },
    {
      label: 'Add Investment',
      href: '/investment-khata',
      icon: PiggyBank,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500',
    },
  ];

  return (
    <Card className="p-4 glass-panel shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
        <Zap className="w-4 h-4 text-[#FF7A00]" />
        <span>Quick Financial Actions:</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full sm:w-auto">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link key={act.label} href={act.href}>
              <div
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${act.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{act.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
