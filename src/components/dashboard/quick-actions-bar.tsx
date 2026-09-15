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
    { label: 'Add Customer', href: '/customers', icon: UserPlus },
    { label: 'Create Loan', href: '/loans', icon: Landmark },
    { label: 'Record Collection', href: '/collections', icon: Receipt },
    { label: 'Add Expense', href: '/expenses', icon: Wallet },
    { label: 'Add Capital', href: '/investment-khata', icon: PiggyBank },
  ];

  return (
    <Card className="p-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Quick Actions:</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full sm:w-auto">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link key={act.label} href={act.href}>
              <div
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:border-blue-600 text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
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
