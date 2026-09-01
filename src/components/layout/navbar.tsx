'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useLanguage } from '@/i18n/language-context';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { getInitials } from '@/lib/utils';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Shield,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileNav: () => void;
}

export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathSegment = pathname.split('/')[1] || 'dashboard';
  const pageTitleKey = `nav.${pathSegment}`;
  const pageTitle = t(pageTitleKey, pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1));

  return (
    <header className="h-18 border-b border-slate-200/80 dark:border-[#1E293B]/80 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-2xl sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between transition-colors shadow-sm">
      {/* Left Section: Mobile Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-xl text-slate-500 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#F97316] shadow-sm shadow-[#F97316]" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider">
            <span>FinCollect</span>
            <span>/</span>
          </div>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right Section: Smart Search, Language, Notifications, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Smart Search */}
        <div className="hidden lg:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder', 'Smart Search loans, customers...')}
            className="w-64 h-9.5 pl-10 pr-9 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#141A25]/90 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] transition-all"
          />
          <kbd className="absolute right-3 text-[9px] font-mono font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Global Language Selector */}
        <LanguageSelector />

        {/* Notifications Icon with Pulse Badge */}
        <button
          className="w-9.5 h-9.5 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white dark:ring-[#0B0F17] animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F97316] to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
              AD
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-[#0B0F17] rounded-full" />
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Administrator
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Owner Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">Administrator</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@fincollect.pro</p>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
