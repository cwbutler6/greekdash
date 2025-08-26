'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, 
  ChevronDown,
  Users, 
  DollarSign, 
  Calendar, 
  Settings, 
  Shield, 
  Zap,
  BookOpen,
  UserPlus,
  UserCheck,
  CreditCard,
  BarChart3,
  MessageSquare,
  FileText,
  Image,
  Wallet,
  Lock,
  ShieldCheck,
  AlertCircle,
  X,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NavigationSection, NavigationItem } from '@/types/docs';
import { 
  isNavigationItemActive, 
  shouldExpandNavigationItem 
} from '@/lib/docs-navigation';
import { NavigationErrorBoundary } from './error-boundaries/navigation-error-boundary';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Getting Started',
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        title: 'Quick Start',
        href: '/docs/getting-started',
      },
    ],
  },
  {
    title: 'Admin Guide',
    icon: <Settings className="h-4 w-4" />,
    items: [
      {
        title: 'Overview',
        href: '/docs/admin-guide',
      },
      {
        title: 'Members',
        href: '/docs/admin-guide/members',
        icon: <Users className="h-4 w-4" />,
        children: [
          {
            title: 'Inviting Members',
            href: '/docs/admin-guide/members/invites',
            icon: <UserPlus className="h-4 w-4" />,
          },
          {
            title: 'Pending Members',
            href: '/docs/admin-guide/members/pending',
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            title: 'Member Directory',
            href: '/docs/admin-guide/members/directory',
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: 'Communication & Broadcasts',
            href: '/docs/admin-guide/members/communication',
            badge: 'New',
            icon: <MessageSquare className="h-4 w-4" />,
          },
          {
            title: 'Roles & Permissions',
            href: '/docs/admin-guide/members/roles-permissions',
            badge: 'New',
            icon: <Shield className="h-4 w-4" />,
          },
          {
            title: 'Troubleshooting',
            href: '/docs/admin-guide/members/troubleshooting',
            badge: 'New',
            icon: <AlertCircle className="h-4 w-4" />,
          },
        ],
      },
      {
        title: 'Management',
        href: '/docs/admin-guide/management',
        icon: <Settings className="h-4 w-4" />,
        children: [
          {
            title: 'Events',
            href: '/docs/admin-guide/events',
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            title: 'Finance',
            href: '/docs/admin-guide/finance',
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            title: 'Broadcasts',
            href: '/docs/admin-guide/broadcasts',
            icon: <MessageSquare className="h-4 w-4" />,
          },
          {
            title: 'Files',
            href: '/docs/admin-guide/files',
            icon: <FileText className="h-4 w-4" />,
          },
          {
            title: 'Gallery',
            href: '/docs/admin-guide/gallery',
            icon: <Image className="h-4 w-4" />,
          },
          {
            title: 'Treasury',
            href: '/docs/admin-guide/treasury',
            icon: <Wallet className="h-4 w-4" />,
          },
        ],
      },
      {
        title: 'Settings',
        href: '/docs/admin-guide/settings',
        icon: <Settings className="h-4 w-4" />,
        children: [
          {
            title: 'Chapter Settings',
            href: '/docs/admin-guide/settings/chapter',
            icon: <Settings className="h-4 w-4" />,
          },
          {
            title: 'Billing',
            href: '/docs/admin-guide/settings/billing',
            icon: <CreditCard className="h-4 w-4" />,
          },
        ],
      },
    ],
  },
  {
    title: 'Features',
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        title: 'Features Overview',
        href: '/docs/features',
      },
      {
        title: 'Member Management',
        href: '/docs/features/members',
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: 'Financial Tools',
        href: '/docs/features/finance',
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: 'Communication',
        href: '/docs/features/communication',
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        title: 'Analytics',
        href: '/docs/features/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Security & Compliance',
    icon: <Shield className="h-4 w-4" />,
    items: [
      {
        title: 'Security Overview',
        href: '/docs/security',
      },
      {
        title: 'Data Protection',
        href: '/docs/security/data-protection',
        icon: <Lock className="h-4 w-4" />,
      },
      {
        title: 'Compliance',
        href: '/docs/security/compliance',
        icon: <ShieldCheck className="h-4 w-4" />,
      },
    ],
  },
];

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize expanded items based on current path
  useEffect(() => {
    const newExpanded = new Set<string>();
    
    const checkAndExpand = (items: NavigationItem[]) => {
      items.forEach(item => {
        if (item.children && shouldExpandNavigationItem(item, pathname)) {
          newExpanded.add(item.href);
          checkAndExpand(item.children);
        }
      });
    };

    navigationSections.forEach(section => {
      checkAndExpand(section.items);
    });

    setExpandedItems(newExpanded);
  }, [pathname]);

  // Handle touch gestures for swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    // const isRightSwipe = distanceX < -50; // Reserved for future use
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Close sidebar on left swipe (swipe to close)
    if (isLeftSwipe && !isVerticalSwipe) {
      onClose();
    }

    // Prevent accidental swipes
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = () => {
    onClose();
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = isNavigationItemActive(item, pathname);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);
    const shouldShowChildren = hasChildren && isExpanded;

    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            onClick={handleItemClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1 min-h-[48px]', // Larger touch targets
              isActive && 'bg-accent text-accent-foreground font-semibold',
              level > 0 && 'ml-4'
            )}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
          </Link>
          
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(item.href);
              }}
              className={cn(
                'p-3 rounded-lg hover:bg-accent transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center', // Larger touch target
                level > 0 && 'mr-4'
              )}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.title}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        
        {shouldShowChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        onClick={onClose}
        aria-label="Close navigation"
      />

      {/* Mobile Navigation Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-semibold text-lg">Documentation</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Content */}
        <NavigationErrorBoundary navigationContext="sidebar">
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 flex items-center gap-2 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.icon}
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => renderNavigationItem(item))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </NavigationErrorBoundary>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="text-center">
            <Button asChild className="w-full">
              <Link href="/">Start Free Trial</Link>
            </Button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Swipe left to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Mobile navigation toggle button with improved touch targets
 */
export function MobileNavigationToggle({ 
  isOpen, 
  onToggle, 
  className 
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "lg:hidden h-10 w-10 p-0", // Larger touch target
        className
      )}
      onClick={onToggle}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </Button>
  );
}