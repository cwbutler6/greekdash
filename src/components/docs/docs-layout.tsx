'use client';

import { useState, useEffect } from 'react';
import { DocsSidebar } from './docs-sidebar';
import { DocsHeader } from './docs-header';
import { DocsBreadcrumbs } from './docs-breadcrumbs';
import { cn } from '@/lib/utils';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Close sidebar on route change (handled by sidebar component)
  // Close sidebar on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader
        onMenuToggle={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="pt-16 lg:pt-0 h-full">
            <DocsSidebar
              onItemClick={handleSidebarClose}
              isOpen={sidebarOpen}
              onToggle={handleSidebarToggle}
            />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={handleSidebarClose}
            aria-label="Close sidebar"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="px-4 py-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <DocsBreadcrumbs />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}