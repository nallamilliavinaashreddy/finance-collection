import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, prefix, suffix, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const effectiveLeftIcon = leftIcon || (prefix ? <span className="text-xs text-slate-500 dark:text-[#A7B0C0]">{prefix}</span> : null);
    const effectiveRightIcon = rightIcon || icon || (suffix ? <span className="text-xs text-slate-500 dark:text-[#A7B0C0]">{suffix}</span> : null);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-[#A7B0C0] transition-colors duration-150">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {effectiveLeftIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-[#A7B0C0] pointer-events-none flex items-center justify-center transition-colors duration-150">
              {effectiveLeftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-10 px-3.5 text-sm rounded-lg border bg-white dark:bg-[#161B2C] text-slate-900 dark:text-[#F3F4F6] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-[#A855F7] disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-[#111827] placeholder:text-slate-400 dark:placeholder:text-[#6B7280]',
              effectiveLeftIcon && 'pl-10',
              effectiveRightIcon && 'pr-10',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-[#252C40]',
              className
            )}
            {...props}
          />
          {effectiveRightIcon && (
            <div className="absolute right-3 text-slate-400 dark:text-[#A7B0C0] flex items-center justify-center transition-colors duration-150">
              {effectiveRightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 font-medium animate-in fade-in slide-in-from-top-1 duration-150">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-[#A7B0C0]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
