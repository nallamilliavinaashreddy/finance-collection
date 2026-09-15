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
  ChevronDown,
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
    <header className="h-16 border-b border-slate-200/80 dark:border-sky-500/20 bg-white/95 dark:bg-[#070A12]/95 backdrop-blur-xl sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between transition-colors shadow-sm">
      {/* Left Section: Mobile Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span className="text-cyan-400 font-mono">FINCOLLECT</span>
            <span>//</span>
          </div>
          <h1 className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wider uppercase">
            [{pageTitle}]
          </h1>
        </div>
      </div>

      {/* Right Section: Smart Search, Language, Notifications, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Smart Search */}
        <div className="hidden lg:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-sky-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder', 'Smart Search loans, customers...')}
            className="w-64 h-9 pl-9 pr-8 text-xs font-mono font-medium rounded-xl border border-slate-200 dark:border-sky-500/30 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition-colors"
          />
        </div>

        {/* Global Language Selector */}
        <LanguageSelector />

        {/* Notifications Icon */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-sky-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-sky-500/20 transition-colors relative border border-transparent dark:hover:border-sky-500/30"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-4 w-px bg-slate-200 dark:bg-sky-500/20 mx-0.5" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-sky-500/20 transition-colors text-left border border-transparent dark:hover:border-sky-500/30"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-sky-500/30 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
              {getInitials(user?.fullName || 'Admin')}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight font-mono">
                {user?.fullName || 'Administrator'}
              </span>
              <span className="text-[9px] text-cyan-400 uppercase leading-none font-mono font-bold">
                [SYSTEM COMMANDER]
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {user?.email || 'admin@fincollect.app'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>[LOG OUT]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
