'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/i18n/language-context';

export function SplashScreen() {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070707] text-white selection:bg-[#FF7A00] animate-in fade-in duration-300">
      {/* Subtle orange radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF7A00]/15 via-[#070707] to-[#070707] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Centered Hanuman Image Container */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center p-3 rounded-3xl bg-[#111111] border border-[#FF7A00]/30 shadow-2xl shadow-[#FF7A00]/15 animate-subtle-breath">
          <Image
            src="/hanuman.png"
            alt="FinCollect Logo"
            width={160}
            height={160}
            priority
            className="w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(255,122,0,0.35)]"
          />
        </div>

        {/* FINCOLLECT */}
        <h1 className="text-3xl font-black tracking-wider text-white uppercase mb-1 drop-shadow-md">
          {t('loading.title', 'FINCOLLECT')}
        </h1>

        {/* PRO ADMIN */}
        <span className="inline-block px-3 py-0.5 mb-3 text-xs font-extrabold uppercase tracking-widest text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/30 rounded-full shadow-sm">
          {t('loading.subtitle', 'PRO ADMIN')}
        </span>

        {/* Financial Management System */}
        <p className="text-xs text-[#A3A3A3] font-medium tracking-wide mb-8">
          {t('loading.description', 'Financial Management System')}
        </p>

        {/* Subtle Loading Animation Bar */}
        <div className="w-48 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden relative border border-[#262626]">
          <div className="absolute inset-y-0 bg-gradient-to-r from-[#FF7A00] via-[#FF9500] to-[#FF7A00] rounded-full w-1/3 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
