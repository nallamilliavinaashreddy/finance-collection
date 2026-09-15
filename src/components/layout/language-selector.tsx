'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/language-context';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white transition-colors"
        title="Change Application Language"
      >
        <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>{currentOption.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-150">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            Select Language
          </div>
          <div className="flex flex-col gap-0.5">
            {supportedLanguages.map((option) => {
              const isSelected = option.code === language;
              return (
                <button
                  key={option.code}
                  onClick={() => {
                    setLanguage(option.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{option.flag}</span>
                    <div className="flex flex-col leading-tight">
                      <span>{option.nativeName}</span>
                      {option.nativeName !== option.name && (
                        <span className="text-[10px] text-slate-400">{option.name}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
