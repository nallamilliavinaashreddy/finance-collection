import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'daily' | 'weekly' | 'monthly' | 'adjustment' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20',
    success: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
    error: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
    info: 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20',
    purple: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20',
    daily: 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20',
    weekly: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20',
    monthly: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
    adjustment: 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20',
    outline: 'border border-[#26344D] text-[#94A3B8] bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
