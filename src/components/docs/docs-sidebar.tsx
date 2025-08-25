'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Users, DollarSign, Calendar, Settings, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationSection, NavigationItem } from '@/types/docs';

interface DocsSidebarProps {
  onItemClick?: () => void;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Getting Started',
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
        title: 'Member Management',
        href: '/docs/admin-guide/members',
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: 'Financial Management',
        href: '/docs/admin-guide/finance',
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: 'Event Management',
        href: '/docs/admin-guide/events',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: 'Chapter Settings',
        href: '/docs/admin-guide/settings',
        icon: <Settings className="h-4 w-4" />,
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
    ],
  },
];

export function DocsSidebar({ onItemClick }: DocsSidebarProps) {
  const pathname = usePathname();

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-accent text-accent-foreground',
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
          {hasChildren && <ChevronRight className="h-4 w-4" />}
        </Link>
        
        {hasChildren && (
          <div className="mt-1">
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