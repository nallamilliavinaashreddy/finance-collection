'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#262626] p-6 z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-slate-900 dark:text-white',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 dark:text-[#737373] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || description) && (
          <div className="flex flex-col gap-1 pr-6 border-b border-slate-200 dark:border-[#262626] pb-3">
            {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
            {description && <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">{description}</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-[#262626]">{footer}</div>}
      </div>
    </div>
  );
}
