'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/i18n/language-context';

export function SplashScreen() {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080B14] text-white selection:bg-[#8B5CF6] animate-in fade-in duration-300">
      {/* Subtle purple radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#8B5CF6]/20 via-[#080B14] to-[#080B14] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Centered Hanuman Image Container */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center p-3 rounded-3xl bg-[#121A2B] border border-[#26344D] shadow-2xl shadow-[#8B5CF6]/10 animate-subtle-breath">
          <Image
            src="/hanuman.png"
            alt="FinCollect Logo"
            width={160}
            height={160}
            priority
            className="w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(139,92,246,0.35)]"
          />
        </div>

        {/* FINCOLLECT */}
        <h1 className="text-3xl font-black tracking-wider text-white uppercase mb-1 drop-shadow-md">
          {t('loading.title', 'FINCOLLECT')}
        </h1>

        {/* PRO ADMIN */}
        <span className="inline-block px-3 py-0.5 mb-3 text-xs font-extrabold uppercase tracking-widest text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-full shadow-sm">
          {t('loading.subtitle', 'PRO ADMIN')}
        </span>

        {/* Financial Management System */}
        <p className="text-xs text-[#94A3B8] font-medium tracking-wide mb-8">
          {t('loading.description', 'Financial Management System')}
        </p>

        {/* Subtle Loading Animation Bar */}
        <div className="w-48 h-1.5 bg-[#121A2B] rounded-full overflow-hidden relative border border-[#26344D]">
          <div className="absolute inset-y-0 bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#4F8CFF] rounded-full w-1/3 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
