'use client';

import { ResponsiveDocsLayout } from './responsive-docs-layout';

interface DocsLayoutProps {
  children: React.ReactNode;
}

/**
 * Legacy docs layout component - now uses responsive layout
 * @deprecated Use ResponsiveDocsLayout directly for new components
 */
export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <ResponsiveDocsLayout>
      {children}
    </ResponsiveDocsLayout>
  );
}