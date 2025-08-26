'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileX, 
  Search, 
  BookOpen, 
  ArrowLeft, 
  Home,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MissingContentFallbackProps {
  pageSlug?: string;
  section?: string;
  title?: string;
  suggestedPages?: Array<{
    title: string;
    href: string;
    description: string;
  }>;
  showBackButton?: boolean;
  showSearchSuggestion?: boolean;
}

// Default suggested pages when content is missing
const DEFAULT_SUGGESTED_PAGES = [
  {
    title: 'Getting Started Guide',
    href: '/docs/getting-started',
    description: 'New to GreekDash? Start with our comprehensive setup guide.'
  },
  {
    title: 'Member Management',
    href: '/docs/admin-guide/members',
    description: 'Learn how to invite, manage, and organize your chapter members.'
  },
  {
    title: 'Financial Management',
    href: '/docs/admin-guide/finance',
    description: 'Set up dues collection, track expenses, and manage finances.'
  },
  {
    title: 'Event Management',
    href: '/docs/admin-guide/events',
    description: 'Create events, manage RSVPs, and track member engagement.'
  }
];

export function MissingContentFallback({
  pageSlug,
  section,
  title,
  suggestedPages = DEFAULT_SUGGESTED_PAGES,
  showBackButton = true,
  showSearchSuggestion = true
}: MissingContentFallbackProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/docs');
    }
  };

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center space-y-8 p-8">
      {/* Main Error Message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileX className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            {title 
              ? `The documentation page "${title}" could not be found.`
              : "The documentation page you're looking for doesn't exist or has been moved."
            }
          </p>
        </div>

        {/* Page Context */}
        {(pageSlug || section) && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-sm">Requested Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Section:</span>
                  <span className="font-mono">{section}</span>
                </div>
              )}
              {pageSlug && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Page:</span>
                  <span className="font-mono">{pageSlug}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showBackButton && (
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        
        <Button asChild>
          <Link href="/docs">
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation Home
          </Link>
        </Button>
        
        {showSearchSuggestion && (
          <Button asChild variant="outline">
            <Link href="/docs/search">
              <Search className="mr-2 h-4 w-4" />
              Search Documentation
            </Link>
          </Button>
        )}
      </div>

      {/* Suggested Pages */}
      <div className="w-full max-w-4xl space-y-4">
        <h2 className="text-xl font-semibold text-center">
          Popular Documentation Pages
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedPages.map((page, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Link href={page.href} className="block space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{page.title}</h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-sm">
                    {page.description}
                  </CardDescription>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <div className="text-center space-y-4 max-w-md">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Still can&apos;t find what you&apos;re looking for?</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Try browsing our documentation sections or use the search function to find specific topics.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/admin-guide/members">Members</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/admin-guide/finance">Finance</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/admin-guide/events">Events</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/security">Security</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Home Link */}
      <Button asChild variant="ghost" className="mt-8">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Return to GreekDash Home
        </Link>
      </Button>
    </div>
  );
}