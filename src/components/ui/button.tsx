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
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 ease-in-out rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#060913] disabled:opacity-50 disabled:cursor-not-allowed select-none transform-gpu active:scale-[0.98] active:translate-y-[1px]';

    const variants = {
      primary: 'button-3d-primary text-[#F8FAFC] focus:ring-[#8B5CF6]',
      secondary: 'bg-gradient-to-b from-[#1E2C42] to-[#141D2E] text-[#F8FAFC] border-t border-white/15 border-b border-black/50 border-x border-[#1F2C42] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)] focus:ring-[#8B5CF6] hover:-translate-y-0.5 hover:scale-[1.02]',
      outline: 'border-t border-white/10 border border-[#1F2C42] bg-[#0E1626] hover:bg-[#141D2E] hover:border-[#8B5CF6]/60 text-[#94A3B8] hover:text-[#F8FAFC] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] focus:ring-[#8B5CF6] hover:-translate-y-0.5 hover:scale-[1.02]',
      ghost: 'hover:bg-[#141D2E] hover:text-[#F8FAFC] text-[#94A3B8] focus:ring-[#8B5CF6]',
      danger: 'bg-gradient-to-b from-[#EF4444] to-[#B91C1C] border-t border-white/20 text-[#F8FAFC] focus:ring-[#EF4444] shadow-[0_8px_20px_-4px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 hover:scale-[1.02]',
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
