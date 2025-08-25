import { Metadata } from 'next';
import { Suspense } from 'react';
import { DocsSearchPage } from '@/components/docs/docs-search-page';

export const metadata: Metadata = {
  title: 'Search Results | GreekDash Documentation',
  description: 'Search results for GreekDash documentation',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <DocsSearchPage />
    </Suspense>
  );
}