'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/i18n/language-context';

export function SplashScreen() {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0F19] text-white selection:bg-[#A855F7] animate-in fade-in duration-300">
      {/* Subtle purple radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-[#0B0F19] to-[#0B0F19] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Centered Hanuman Image Container */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center p-3 rounded-3xl bg-[#161B2C] border border-[#A855F7]/30 shadow-2xl shadow-purple-500/20 animate-subtle-breath">
          <Image
            src="/hanuman.png"
            alt="FinCollect Logo"
            width={160}
            height={160}
            priority
            className="w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(168,85,247,0.35)]"
          />
        </div>

        {/* FINCOLLECT */}
        <h1 className="text-3xl font-black tracking-wider text-white uppercase mb-1 drop-shadow-md">
          {t('loading.title', 'FINCOLLECT')}
        </h1>

        {/* PRO ADMIN */}
        <span className="inline-block px-3 py-0.5 mb-3 text-xs font-extrabold uppercase tracking-widest text-[#A855F7] bg-purple-500/10 border border-[#A855F7]/30 rounded-full shadow-sm">
          {t('loading.subtitle', 'PRO ADMIN')}
        </span>

        {/* Financial Management System */}
        <p className="text-xs text-[#A7B0C0] font-medium tracking-wide mb-8">
          {t('loading.description', 'Financial Management System')}
        </p>

        {/* Subtle Loading Animation Bar */}
        <div className="w-48 h-1.5 bg-[#161B2C] rounded-full overflow-hidden relative border border-[#252C40]">
          <div className="absolute inset-y-0 bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#6366F1] rounded-full w-1/3 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
