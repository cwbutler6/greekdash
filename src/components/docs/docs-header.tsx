'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileOptimizedSearch } from './mobile-optimized-search';
import { DocsMobileSidebarToggle } from './docs-mobile-sidebar-toggle';

interface DocsHeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function DocsHeader({ onMenuToggle, sidebarOpen }: DocsHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile menu button */}
        <DocsMobileSidebarToggle
          isOpen={sidebarOpen}
          onToggle={onMenuToggle}
          className="mr-2"
        />

        {/* Logo */}
        <Link href="/docs" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">GreekDash</span>
          <span className="text-muted-foreground">Docs</span>
        </Link>

        {/* Search */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <MobileOptimizedSearch 
              showResults={false} 
              isMobile={isMobile}
            />
          </div>
          
          {/* CTA Button */}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}