'use client';

import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DocsSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  // Placeholder search results - will be implemented in later tasks
  const searchResults = [
    {
      title: 'Getting Started with Member Management',
      excerpt: 'Learn how to invite members, manage pending applications, and assign roles...',
      url: '/docs/admin-guide/members',
      section: 'Admin Guide',
      type: 'guide' as const,
    },
    {
      title: 'Setting Up Dues Collection',
      excerpt: 'Configure dues plans, payment processing, and automated reminders...',
      url: '/docs/admin-guide/finance',
      section: 'Admin Guide', 
      type: 'guide' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Search Results</h1>
        {query && (
          <p className="text-xl text-muted-foreground">
            Results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          defaultValue={query}
          className="pl-8"
        />
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {query ? (
          searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} results
              </p>
              {searchResults.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        <a href={result.url} className="hover:underline">
                          {result.title}
                        </a>
                      </CardTitle>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {result.section}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{result.excerpt}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse our documentation sections.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Documentation</h3>
            <p className="text-muted-foreground">
              Enter a search term to find relevant documentation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}