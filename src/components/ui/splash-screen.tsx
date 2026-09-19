'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/i18n/language-context';

export function SplashScreen() {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0F17] text-white animate-in fade-in duration-300">
      {/* Subtle blue radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-[#0B0F17] to-[#0B0F17] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Centered Image Container */}
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <Image
            src="/hanuman.png"
            alt="Jai Ram Finance Logo"
            width={140}
            height={140}
            priority
            className="w-full h-full object-contain"
          />
        </div>

        {/* JAI RAM FINANCE */}
        <h1 className="text-2xl font-bold tracking-wider text-white uppercase mb-1">
          {t('loading.title', 'JAI RAM FINANCE')}
        </h1>

        {/* PRO ADMIN */}
        <span className="inline-block px-3 py-0.5 mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
          {t('loading.subtitle', 'PRO ADMIN')}
        </span>

        {/* Financial Management System */}
        <p className="text-xs text-slate-400 font-medium tracking-wide mb-8">
          {t('loading.description', 'Financial Management System')}
        </p>

        {/* Loading Progress Bar */}
        <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 bg-blue-600 rounded-full w-1/3 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
