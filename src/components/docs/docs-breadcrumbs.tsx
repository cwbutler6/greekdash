'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbsFromPath } from '@/lib/docs-navigation';

export function DocsBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbsFromPath(pathname);
  
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav 
      className="flex items-center space-x-1 text-sm text-muted-foreground mb-6"
      aria-label="Breadcrumb navigation"
    >
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Go to GreekDash home"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
          {index === breadcrumbs.length - 1 ? (
            <span 
              className="font-medium text-foreground"
              aria-current="page"
            >
              {item.title}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}