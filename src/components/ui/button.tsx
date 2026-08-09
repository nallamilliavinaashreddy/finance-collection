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
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070707] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-[#FF7A00] hover:bg-[#FF9500] text-white focus:ring-[#FF7A00] shadow-md shadow-[#FF7A00]/20 hover:shadow-lg hover:shadow-[#FF7A00]/30',
      secondary: 'bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] focus:ring-[#FF7A00]',
      outline: 'border border-[#262626] hover:border-[#FF7A00]/50 hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-white focus:ring-[#FF7A00]',
      ghost: 'hover:bg-[#1A1A1A] hover:text-[#FF7A00] text-[#A3A3A3] focus:ring-[#FF7A00]',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30',
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
