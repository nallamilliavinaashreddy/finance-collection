'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col">
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
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
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
    </div>
  );
}
