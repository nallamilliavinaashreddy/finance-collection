'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MoneyRainBackground } from '@/components/ui/money-rain-background';
import { FinCollectAIDrawer } from '@/components/ai/fincollect-ai-drawer';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09101F] text-slate-900 dark:text-[#F8FAFC] flex flex-col transition-colors relative overflow-x-hidden app-3d-root">
      {/* Futuristic Ambient Lighting & Grid Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] dark:opacity-80" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] dark:opacity-70" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px] dark:opacity-60" />
        <div className="absolute inset-0 futuristic-grid-bg opacity-40 dark:opacity-60" />
      </div>

      {/* Cinematic Falling Money Background Engine */}
      <MoneyRainBackground />

      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main App Container */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out relative z-10',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        {/* Top Navbar */}
        <Navbar onOpenMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Page Content Workspace */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Global FinCollect AI Floating Copilot Drawer */}
      <FinCollectAIDrawer />
    </div>
  );
}
