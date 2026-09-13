import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 ease-out rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] transform-gpu';

    const variants = {
      primary: 'bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#3B82F6] hover:brightness-110 text-white focus:ring-[#6366F1] shadow-md hover:shadow-indigo-500/25 border border-white/20',
      secondary: 'bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/15 dark:hover:bg-white/15 text-slate-900 dark:text-white backdrop-blur-xl border border-slate-200/80 dark:border-white/15 focus:ring-[#6366F1] shadow-xs',
      outline: 'border border-slate-300/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 backdrop-blur-md focus:ring-[#6366F1]',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:ring-[#6366F1]',
      danger: 'bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white focus:ring-rose-500 shadow-sm border border-white/20',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8.5 rounded-xl',
      md: 'text-xs font-bold px-4 py-2 gap-2 h-10 rounded-2xl',
      lg: 'text-sm font-bold px-6 py-3 gap-2.5 h-12 rounded-2xl',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-1 text-current" />
        ) : (
          leftIcon && <span className="shrink-0 transition-transform duration-150 group-hover:scale-105">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
