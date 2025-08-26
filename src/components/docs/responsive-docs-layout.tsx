'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DocsSidebar } from './docs-sidebar';
import { MobileNavigation, MobileNavigationToggle } from './mobile-navigation';
import { DocsBreadcrumbs } from './docs-breadcrumbs';
import { TableOfContents, useTableOfContents } from './table-of-contents';
import { MobileTableOfContents, FloatingTOC } from './mobile-table-of-contents';
import { MobileOptimizedSearch } from './mobile-optimized-search';

interface ResponsiveDocsLayoutProps {
  children: React.ReactNode;
  showTableOfContents?: boolean;
  maxWidth?: 'full' | '4xl' | '6xl' | '7xl';
}

export function ResponsiveDocsLayout({ 
  children, 
  showTableOfContents = true,
  maxWidth = '4xl'
}: ResponsiveDocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const toc = useTableOfContents();

  // Hydration-safe client detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    if (!isClient) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  const maxWidthClasses = {
    full: 'max-w-full',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  // Use suppressHydrationWarning for the dynamic parts
  const showMobileToggle = isClient && isMobile;
  const showDesktopSidebar = isClient && !isMobile;
  const showMobileNav = isClient && isMobile;
  const showMobileSearch = isClient && isMobile;
  const showMobileTOC = isClient && isMobile && showTableOfContents && toc.length > 0;
  const showDesktopTOC = isClient && showTableOfContents && !isMobile && toc.length > 0;
  const showFloatingTOC = isClient && isMobile && showTableOfContents && toc.length > 0;
  const useDesktopLayout = isClient && !isMobile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-center">
        <div className="container flex h-14 items-center">
          {/* Mobile menu button */}
          <div suppressHydrationWarning>
            {showMobileToggle && (
              <MobileNavigationToggle
                isOpen={sidebarOpen}
                onToggle={handleSidebarToggle}
                className="mr-2"
              />
            )}
          </div>

          {/* Logo */}
          <div className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">GreekDash</span>
            <span className="text-muted-foreground">Docs</span>
          </div>

          {/* Search */}
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none" suppressHydrationWarning>
              {showMobileSearch ? (
                <MobileOptimizedSearch 
                  showResults={false} 
                  isMobile={true}
                />
              ) : (
                <MobileOptimizedSearch showResults={false} />
              )}
            </div>
            
            {/* CTA Button - hidden on mobile */}
            <button className="hidden md:inline-flex h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div suppressHydrationWarning>
          {showDesktopSidebar && (
            <aside className="fixed inset-y-0 left-0 z-30 w-64 transform bg-background border-r transition-transform duration-300 ease-in-out translate-x-0 top-14">
              <div className="h-full">
                <DocsSidebar />
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Navigation */}
        <div suppressHydrationWarning>
          {showMobileNav && (
            <MobileNavigation
              isOpen={sidebarOpen}
              onToggle={handleSidebarToggle}
              onClose={handleSidebarClose}
            />
          )}
        </div>

        {/* Main content */}
        <main className={cn(
          'flex-1 min-w-0',
          useDesktopLayout && 'ml-64' // Account for desktop sidebar
        )} suppressHydrationWarning>
          <div className="px-4 py-6 lg:px-8">
            <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
              {/* Breadcrumbs */}
              <DocsBreadcrumbs />

              {/* Mobile TOC */}
              <div suppressHydrationWarning>
                {showMobileTOC && (
                  <MobileTableOfContents items={toc} />
                )}
              </div>

              {/* Content Layout */}
              <div className={cn(
                'grid gap-8',
                showDesktopTOC
                  ? 'lg:grid-cols-[1fr_250px]'
                  : 'grid-cols-1'
              )} suppressHydrationWarning>
                {/* Main Content */}
                <div className="min-w-0">
                  {children}
                </div>

                {/* Desktop TOC */}
                {showDesktopTOC && (
                  <aside className="hidden lg:block">
                    <div className="sticky top-24">
                      <TableOfContents items={toc} />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating TOC for mobile */}
      <div suppressHydrationWarning>
        {showFloatingTOC && (
          <FloatingTOC items={toc} />
        )}
      </div>
    </div>
  );
}

/**
 * Responsive docs page wrapper with mobile optimizations
 */
export function ResponsiveDocsPage({
  title,
  description,
  children,
  showTableOfContents = true,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  showTableOfContents?: boolean;
  className?: string;
}) {
  return (
    <ResponsiveDocsLayout showTableOfContents={showTableOfContents}>
      <div className={cn('space-y-6 mx-auto max-w-4xl', className)}>
        {/* Page Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-muted-foreground lg:text-xl">
              {description}
            </p>
          )}
        </div>
        
        {/* Page Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none mx-auto">
          {children}
        </div>
      </div>
    </ResponsiveDocsLayout>
  );
}

/**
 * Hook to detect mobile viewport (hydration-safe)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  return isClient ? isMobile : false;
}