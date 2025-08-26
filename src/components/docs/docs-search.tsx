'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { searchDocumentation, generateSearchIndex, trackSearchQuery, type SearchResult } from '@/lib/docs-search';
import { SearchErrorBoundary } from './error-boundaries/search-error-boundary';

interface DocsSearchProps {
  placeholder?: string;
  showResults?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

export function DocsSearch({ 
  placeholder = "Search documentation...", 
  showResults = true,
  onResultSelect 
}: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchIndex, setSearchIndex] = useState<Awaited<ReturnType<typeof generateSearchIndex>> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Perform search when query changes
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchIndex || !searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate slight delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const searchResults = searchDocumentation(searchQuery, searchIndex);
      setResults(searchResults);
      setShowDropdown(searchResults.length > 0);
      setSelectedIndex(-1);
      
      // Track search query
      trackSearchQuery(searchQuery, searchResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchIndex]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showResults) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch, showResults]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e as React.FormEvent);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        } else {
          handleSubmit(e as React.FormEvent);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/docs/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }
  };

  // Handle input focus/blur
  const handleFocus = () => {
    if (results.length > 0 && showResults) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for result clicks
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <SearchErrorBoundary query={query}>
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-8 pr-4"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-2 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div 
              ref={dropdownRef}
              className="max-h-96 overflow-y-auto"
            >
              {results.length > 0 ? (
                <>
                  {results.map((result, index) => (
                    <div
                      key={`${result.url}-${index}`}
                      className={cn(
                        "flex items-start gap-3 p-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors",
                        selectedIndex === index && "bg-muted"
                      )}
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {result.title}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {result.section}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.excerpt}
                        </p>
                      </div>
                      {selectedIndex === index && (
                        <CornerDownLeft className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                  
                  {/* Show more results hint */}
                  {results.length >= 10 && (
                    <div className="p-3 text-center border-t">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Press Enter to see all results
                      </button>
                    </div>
                  )}
                </>
              ) : query.trim() && !isLoading ? (
                <div className="p-6 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &quot;{query}&quot;
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-40 mt-1">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm p-2 rounded-b border border-t-0">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
      </div>
    </SearchErrorBoundary>
  );
}