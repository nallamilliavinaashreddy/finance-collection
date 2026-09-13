import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'daily' | 'weekly' | 'monthly' | 'adjustment' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md',
    error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 backdrop-blur-md',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 backdrop-blur-md',
    purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 backdrop-blur-md',
    daily: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md',
    weekly: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md',
    monthly: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-md',
    adjustment: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 backdrop-blur-md',
    outline: 'border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight transition-all duration-150 shadow-2xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
