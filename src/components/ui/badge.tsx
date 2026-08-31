import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
    error: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
    info: 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20',
    outline: 'border border-slate-300 dark:border-[#262626] text-slate-600 dark:text-[#A3A3A3] bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
