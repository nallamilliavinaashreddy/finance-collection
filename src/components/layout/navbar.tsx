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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumb title from pathname
  const pathSegment = pathname.split('/')[1] || 'dashboard';
  const pageTitleKey = `nav.${pathSegment}`;
  const pageTitle = t(pageTitleKey, pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1));

  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#1E1E1E] bg-white/90 dark:bg-[#0D0D0D]/90 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Left Section: Mobile Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-[#737373]">Pages</span>
          <span className="text-xs text-slate-400 dark:text-[#737373]">/</span>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right Section: Search, Language Selector, Theme Toggle & Admin Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search Input */}
        <div className="hidden lg:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-[#737373] pointer-events-none" />
          <input
            type="text"
            placeholder={t('nav.searchPlaceholder', 'Search loans, customers...')}
            className="w-56 h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-colors"
          />
        </div>

        {/* Global Language Selector Dropdown */}
        <LanguageSelector />

        {/* Notifications Icon */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF7A00] ring-2 ring-white dark:ring-[#0D0D0D]" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-5 w-px bg-slate-200 dark:bg-[#1E1E1E] mx-1" />

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {getInitials(user?.fullName || 'Admin')}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                {user?.fullName || 'System Admin'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#A3A3A3] font-medium mt-0.5">
                {t('nav.singleAdmin', 'Single Admin')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373] hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#141414] rounded-2xl shadow-xl border border-slate-200 dark:border-[#262626] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Header */}
              <div className="p-3 border-b border-slate-200 dark:border-[#262626] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF7A00] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {getInitials(user?.fullName || 'Admin')}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'System Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] truncate">
                    {user?.email || 'admin@finance.com'}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="p-2.5 my-1 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-between text-xs text-[#FF7A00] font-medium">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#FF7A00]" />
                  <span>{t('nav.adminPrivilege', 'Admin Privilege')}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00]">
                  {t('nav.active', 'Active')}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.signOut', 'Sign Out')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
