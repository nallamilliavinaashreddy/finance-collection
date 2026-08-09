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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1A1A1A] hover:border-[#FF7A00]/40 text-xs font-semibold text-white transition-all duration-200"
        title="Change Application Language"
      >
        <Languages className="w-4 h-4 text-[#FF7A00]" />
        <span>{currentOption.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#737373] border-b border-[#262626] mb-1">
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
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left',
                    isSelected
                      ? 'bg-[#FF7A00]/10 text-[#FF7A00] font-bold'
                      : 'text-slate-300 hover:bg-[#1A1A1A] hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{option.flag}</span>
                    <div className="flex flex-col leading-tight">
                      <span>{option.nativeName}</span>
                      {option.nativeName !== option.name && (
                        <span className="text-[10px] text-[#737373]">{option.name}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF7A00]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
