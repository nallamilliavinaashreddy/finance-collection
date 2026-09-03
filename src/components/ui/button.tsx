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
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080B14] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#4F8CFF] hover:opacity-95 text-[#F8FAFC] focus:ring-[#8B5CF6] shadow-sm border-0',
      secondary: 'bg-[#182237] hover:bg-[#1E293B] text-[#F8FAFC] border border-[#26344D] focus:ring-[#8B5CF6]',
      outline: 'border border-[#26344D] bg-[#121A2B] hover:bg-[#182237] hover:border-[#8B5CF6]/50 text-[#94A3B8] hover:text-[#F8FAFC] focus:ring-[#8B5CF6]',
      ghost: 'hover:bg-[#182237] hover:text-[#F8FAFC] text-[#94A3B8] focus:ring-[#8B5CF6]',
      danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-[#F8FAFC] focus:ring-[#EF4444] shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-3 gap-2.5 h-12',
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
