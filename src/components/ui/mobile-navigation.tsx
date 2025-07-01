'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, Calendar, Users, DollarSign, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/user-menu';
import { cn } from '@/lib/utils';

interface NavigationLink {
  href: string;
  label: string;
  isActive?: boolean;
}

interface MobileNavigationProps {
  chapterSlug: string;
  navigationLinks: NavigationLink[];
  isAdmin: boolean;
  primaryColor: string;
  secondaryColor: string;
}

const getIconForLabel = (label: string) => {
  switch (label.toLowerCase()) {
    case 'dashboard':
      return <Home className="h-5 w-5" />;
    case 'events':
      return <Calendar className="h-5 w-5" />;
    case 'members':
      return <Users className="h-5 w-5" />;
    case 'dues':
      return <DollarSign className="h-5 w-5" />;
    case 'files':
      return <FileText className="h-5 w-5" />;
    default:
      return <Home className="h-5 w-5" />;
  }
};

export function MobileNavigation({ 
  chapterSlug, 
  navigationLinks, 
  isAdmin, 
  primaryColor, 
  secondaryColor 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to determine if a link is active
  const isLinkActive = (linkHref: string) => {
    // Exact match for dashboard
    if (linkHref === `/${chapterSlug}/portal`) {
      return pathname === linkHref;
    }
    
    // For other links, check if pathname starts with the link href
    // but make sure it's not just a partial match
    if (pathname.startsWith(linkHref)) {
      // Ensure the next character is either end of string or a slash
      const nextChar = pathname[linkHref.length];
      return nextChar === undefined || nextChar === '/';
    }
    
    return false;
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        className="md:hidden text-white hover:bg-white/10"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={toggleMenu}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ backgroundColor: secondaryColor }}
      >
        {/* Menu Header */}
        <div 
          className="flex h-16 items-center justify-between px-4 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h2 className="text-lg font-semibold">Navigation</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationLinks.map((link) => {
                const isActive = isLinkActive(link.href);
                
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      style={isActive ? { backgroundColor: primaryColor } : {}}
                    >
                      {getIconForLabel(link.label)}
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Admin Dashboard Link for Mobile */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href={`/${chapterSlug}/admin`}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isLinkActive(`/${chapterSlug}/admin`)
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  style={isLinkActive(`/${chapterSlug}/admin`) ? { backgroundColor: primaryColor } : {}}
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Menu at Bottom */}
          <div className="border-t border-gray-200 p-4">
            <UserMenu 
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
        </div>
      </div>
    </>
  );
}