'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  SearchX, 
  Search, 
  BookOpen, 
  TrendingUp, 
  RefreshCw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchFailureFallbackProps {
  query?: string;
  errorMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

// Popular search terms and their corresponding pages
const POPULAR_SEARCHES = [
  {
    term: 'invite members',
    description: 'Learn how to send invitations to new chapter members',
    href: '/docs/admin-guide/members/invites'
  },
  {
    term: 'dues setup',
    description: 'Configure dues plans and payment processing',
    href: '/docs/admin-guide/finance/dues-setup'
  },
  {
    term: 'create events',
    description: 'Set up chapter events and manage RSVPs',
    href: '/docs/admin-guide/events/event-creation'
  },
  {
    term: 'member roles',
    description: 'Understand and assign member roles and permissions',
    href: '/docs/admin-guide/members/roles-permissions'
  },
  {
    term: 'financial reports',
    description: 'Generate and understand financial reports',
    href: '/docs/admin-guide/finance/reports'
  },
  {
    term: 'stripe integration',
    description: 'Set up and troubleshoot Stripe payment processing',
    href: '/docs/admin-guide/finance/stripe-integration'
  }
];

// Search tips to help users find what they need
const SEARCH_TIPS = [
  {
    tip: 'Use specific terms',
    description: 'Try "invite members" instead of just "invite"',
    icon: Lightbulb
  },
  {
    tip: 'Check spelling',
    description: 'Make sure your search terms are spelled correctly',
    icon: Lightbulb
  },
  {
    tip: 'Try synonyms',
    description: 'Use different words like "dues" or "payments"',
    icon: Lightbulb
  },
  {
    tip: 'Browse sections',
    description: 'Navigate through documentation sections manually',
    icon: Lightbulb
  }
];

export function SearchFailureFallback({
  query,
  errorMessage,
  showRetry = true,
  onRetry
}: SearchFailureFallbackProps) {
  const [newQuery, setNewQuery] = useState('');
  const router = useRouter();

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuery.trim()) {
      router.push(`/docs/search?q=${encodeURIComponent(newQuery.trim())}`);
    }
  };

  const handlePopularSearch = (term: string) => {
    router.push(`/docs/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Error Message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <SearchX className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Search Unavailable</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {errorMessage || "We're having trouble with the search function right now. Try the alternatives below."}
          </p>
          
          {query && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Your search:</p>
              <code className="bg-muted px-2 py-1 rounded text-sm">&quot;{query}&quot;</code>
            </div>
          )}
        </div>
      </div>

      {/* Retry Section */}
      {showRetry && (
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={onRetry || (() => window.location.reload())} 
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Search
          </Button>
          
          <Button asChild>
            <Link href="/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Documentation
            </Link>
          </Button>
        </div>
      )}

      {/* Alternative Search */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Try a New Search
          </CardTitle>
          <CardDescription>
            Enter different search terms to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNewSearch} className="space-y-3">
            <Input
              placeholder="Search documentation..."
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="w-full" disabled={!newQuery.trim()}>
              <Search className="mr-2 h-4 w-4" />
              Search Again
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Popular Searches */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center flex items-center justify-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Popular Searches
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {POPULAR_SEARCHES.map((search, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <button
                  onClick={() => handlePopularSearch(search.term)}
                  className="w-full text-left space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{search.term}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {search.description}
                  </p>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Search Tips</CardTitle>
          <CardDescription>
            Get better results with these search strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SEARCH_TIPS.map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <IconComponent className="h-4 w-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">{tip.tip}</p>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Manual Navigation */}
      <div className="text-center space-y-4">
        <h4 className="font-medium text-muted-foreground">
          Or browse documentation sections manually:
        </h4>
        
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/docs/getting-started">Getting Started</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/docs/admin-guide/members">Members</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/docs/admin-guide/finance">Finance</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/docs/admin-guide/events">Events</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/docs/security">Security</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}