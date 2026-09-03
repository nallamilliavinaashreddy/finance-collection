import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-purple-500/15 text-[#A855F7] border-purple-500/30',
    success: 'bg-emerald-500/15 text-[#34D399] border-emerald-500/30',
    warning: 'bg-amber-500/15 text-[#F59E0B] border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-indigo-500/15 text-[#60A5FA] border-indigo-500/30',
    outline: 'border border-[#252C40] text-[#A7B0C0] bg-transparent',
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
