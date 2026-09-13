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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay - iOS Glass Blur */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Container - iOS Sheet */}
      <div
        className={cn(
          'relative w-full bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/15 p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-slate-900 dark:text-[#F8FAFC]',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {(title || description) && (
          <div className="flex flex-col gap-1 pr-8 border-b border-slate-100 dark:border-white/10 pb-4">
            {title && <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">{title}</h3>}
            {description && <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">{description}</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
}
