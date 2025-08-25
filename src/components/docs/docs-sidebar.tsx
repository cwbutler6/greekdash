'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationSection, NavigationItem } from '@/types/docs';
import { 
  isNavigationItemActive, 
  shouldExpandNavigationItem 
} from '@/lib/docs-navigation';

interface DocsSidebarProps {
  onItemClick?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
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

export function DocsSidebar({ onItemClick }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
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
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1',
              isActive && 'bg-accent text-accent-foreground font-semibold',
              level > 0 && 'ml-4'
            )}
          >
            {item.icon}
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
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
                'p-1 rounded hover:bg-accent transition-colors',
                level > 0 && 'mr-4'
              )}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.title}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
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

  return (
    <nav className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground">
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
  );
}