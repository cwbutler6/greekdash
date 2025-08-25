'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  searchDocumentation, 
  generateSearchIndex, 
  getPopularQueries,
  trackSearchQuery,
  type SearchResult 
} from '@/lib/docs-search';

export function DocsSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState<Awaited<ReturnType<typeof generateSearchIndex>> | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'title'>('relevance');

  // Generate search index on component mount
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const index = await generateSearchIndex();
        setSearchIndex(index);
      } catch (error) {
        console.error('Failed to generate search index:', error);
      }
    };

    loadSearchIndex();
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchIndex || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      let searchResults = searchDocumentation(searchQuery, searchIndex);
      
      // Apply filters
      if (selectedSection !== 'all') {
        searchResults = searchResults.filter(result => 
          result.section.toLowerCase().replace(/\s+/g, '-') === selectedSection
        );
      }
      
      if (selectedType !== 'all') {
        searchResults = searchResults.filter(result => result.type === selectedType);
      }
      
      // Apply sorting
      if (sortBy === 'title') {
        searchResults.sort((a, b) => a.title.localeCompare(b.title));
      }
      // Default is already sorted by relevance (score)
      
      setResults(searchResults);
      
      // Track search query
      trackSearchQuery(searchQuery, searchResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchIndex, selectedSection, selectedType, sortBy]);

  // Perform search when query or filters change
  useEffect(() => {
    if (searchIndex && query.trim()) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, searchIndex, selectedSection, selectedType, sortBy, performSearch]);

  // Perform initial search if query is provided
  useEffect(() => {
    if (initialQuery && searchIndex) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch, searchIndex]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Update URL with new query
      const newUrl = `/docs/search?q=${encodeURIComponent(query)}`;
      router.push(newUrl);
      performSearch(query);
    }
  };

  const handlePopularQuery = (popularQuery: string) => {
    setQuery(popularQuery);
    const newUrl = `/docs/search?q=${encodeURIComponent(popularQuery)}`;
    router.push(newUrl);
  };

  const clearFilters = () => {
    setSelectedSection('all');
    setSelectedType('all');
    setSortBy('relevance');
  };

  const hasActiveFilters = selectedSection !== 'all' || selectedType !== 'all' || sortBy !== 'relevance';

  // Get unique sections from results for filter options
  const availableSections = Array.from(new Set(
    searchIndex?.pages.map(page => ({
      value: page.section.toLowerCase().replace(/\s+/g, '-'),
      label: page.section
    })) || []
  ));

  const popularQueries = getPopularQueries();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Search Documentation</h1>
        {query && (
          <p className="text-xl text-muted-foreground">
            {results.length > 0 
              ? `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
              : `No results found for "${query}"`
            }
          </p>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 h-12 text-base"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </form>

      {/* Filters and Sorting */}
      {query && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {availableSections.map(section => (
                <SelectItem key={section.value} value={section.value}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="guide">Guides</SelectItem>
              <SelectItem value="feature">Features</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'relevance' | 'title') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">
            Search Results {results.length > 0 && `(${results.length})`}
          </TabsTrigger>
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-1" />
            Popular Searches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {query ? (
            results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={`${result.url}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight">
                            <a 
                              href={result.url} 
                              className="hover:underline text-primary"
                            >
                              {result.title}
                            </a>
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {result.section}
                            </Badge>
                            {result.subsection && (
                              <Badge variant="outline" className="text-xs">
                                {result.subsection}
                              </Badge>
                            )}
                            <Badge 
                              variant={result.type === 'guide' ? 'default' : 'outline'} 
                              className="text-xs"
                            >
                              {result.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {Math.round(result.score)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm leading-relaxed">
                        {result.excerpt}
                      </CardDescription>
                      <div className="mt-3">
                        <a 
                          href={result.url}
                          className="text-sm text-primary hover:underline"
                        >
                          {result.url}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or browse our documentation sections.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularQueries.slice(0, 4).map(popularQuery => (
                    <Button
                      key={popularQuery}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePopularQuery(popularQuery)}
                    >
                      {popularQuery}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search Documentation</h3>
              <p className="text-muted-foreground mb-6">
                Enter a search term above to find relevant documentation.
              </p>
              <div className="space-y-4">
                <h4 className="font-medium">Popular searches:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularQueries.map(popularQuery => (
                    <Button
                      key={popularQuery}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePopularQuery(popularQuery)}
                    >
                      {popularQuery}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Popular Search Queries</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularQueries.map((popularQuery, index) => (
                <Card 
                  key={popularQuery}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePopularQuery(popularQuery)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{popularQuery}</p>
                        <p className="text-xs text-muted-foreground">
                          Click to search
                        </p>
                      </div>
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}