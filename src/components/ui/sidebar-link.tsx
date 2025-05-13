'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  href: string;
  children: ReactNode;
  badge?: ReactNode;
  exactMatch?: boolean;
}

export function SidebarLink({ 
  href, 
  children, 
  badge,
  exactMatch = false
}: SidebarLinkProps) {
  const pathname = usePathname();
  
  // Check if the current path matches this link
  const isActive = exactMatch 
    ? pathname === href
    : pathname.startsWith(href);
  
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
        isActive 
          ? "bg-emerald-100 text-emerald-900 font-medium" 
          : "bg-white hover:bg-slate-100 text-slate-800"
      )}
    >
      {children}
      {badge && <div className="ml-auto">{badge}</div>}
    </Link>
  );
}
