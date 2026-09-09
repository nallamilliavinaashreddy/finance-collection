import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'daily' | 'weekly' | 'monthly' | 'adjustment' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/35 shadow-[0_2px_8px_-1px_rgba(139,92,246,0.25)]',
    success: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/35 shadow-[0_2px_8px_-1px_rgba(34,197,94,0.25)]',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/35 shadow-[0_2px_8px_-1px_rgba(245,158,11,0.25)]',
    error: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/35 shadow-[0_2px_8px_-1px_rgba(239,68,68,0.25)]',
    info: 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/35 shadow-[0_2px_8px_-1px_rgba(56,189,248,0.25)]',
    purple: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/35 shadow-[0_2px_8px_-1px_rgba(139,92,246,0.25)]',
    daily: 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/35 shadow-[0_2px_8px_-1px_rgba(249,115,22,0.25)]',
    weekly: 'bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/35 shadow-[0_2px_8px_-1px_rgba(139,92,246,0.25)]',
    monthly: 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/35 shadow-[0_2px_8px_-1px_rgba(59,130,246,0.25)]',
    adjustment: 'bg-[#14B8A6]/15 text-[#2DD4BF] border border-[#14B8A6]/35 shadow-[0_2px_8px_-1px_rgba(20,184,166,0.25)]',
    outline: 'border border-[#26344D] text-[#94A3B8] bg-transparent shadow-xs',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-all duration-200 border-t border-t-white/15 shadow-xs transform-gpu hover:-translate-y-0.5 hover:scale-105',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
