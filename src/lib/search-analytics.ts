/**
 * Search Analytics Utility
 * Tracks search queries and provides insights for documentation improvement
 */

export interface SearchAnalytics {
  query: string;
  timestamp: Date;
  resultCount: number;
  userAgent?: string;
  sessionId?: string;
}

export interface PopularQuery {
  query: string;
  count: number;
  lastSearched: Date;
}

// In-memory storage for demo purposes
// In production, this would be stored in a database
let searchHistory: SearchAnalytics[] = [];
const popularQueries: Map<string, PopularQuery> = new Map();

/**
 * Track a search query
 */
export function trackSearchQuery(
  query: string, 
  resultCount: number, 
  options?: {
    userAgent?: string;
    sessionId?: string;
  }
): void {
  const analytics: SearchAnalytics = {
    query: query.toLowerCase().trim(),
    timestamp: new Date(),
    resultCount,
    userAgent: options?.userAgent,
    sessionId: options?.sessionId,
  };

  // Add to search history
  searchHistory.push(analytics);

  // Update popular queries
  const normalizedQuery = analytics.query;
  if (normalizedQuery.length > 0) {
    const existing = popularQueries.get(normalizedQuery);
    if (existing) {
      existing.count += 1;
      existing.lastSearched = analytics.timestamp;
    } else {
      popularQueries.set(normalizedQuery, {
        query: normalizedQuery,
        count: 1,
        lastSearched: analytics.timestamp,
      });
    }
  }

  // Keep only last 1000 searches to prevent memory issues
  if (searchHistory.length > 1000) {
    searchHistory = searchHistory.slice(-1000);
  }

  // Log for debugging (in production, send to analytics service)
  console.log(`Search tracked: "${query}" - ${resultCount} results`);
}

/**
 * Get popular search queries
 */
export function getPopularSearchQueries(limit: number = 10): string[] {
  return Array.from(popularQueries.values())
    .sort((a, b) => {
      // Sort by count first, then by recency
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.lastSearched.getTime() - a.lastSearched.getTime();
    })
    .slice(0, limit)
    .map(item => item.query);
}

/**
 * Get search analytics summary
 */
export function getSearchAnalyticsSummary(): {
  totalSearches: number;
  uniqueQueries: number;
  averageResultCount: number;
  topQueries: PopularQuery[];
  recentSearches: SearchAnalytics[];
} {
  const totalSearches = searchHistory.length;
  const uniqueQueries = popularQueries.size;
  const averageResultCount = totalSearches > 0 
    ? searchHistory.reduce((sum, search) => sum + search.resultCount, 0) / totalSearches 
    : 0;

  const topQueries = Array.from(popularQueries.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentSearches = searchHistory
    .slice(-20)
    .reverse();

  return {
    totalSearches,
    uniqueQueries,
    averageResultCount: Math.round(averageResultCount * 100) / 100,
    topQueries,
    recentSearches,
  };
}

/**
 * Get queries with no results (for content gap analysis)
 */
export function getNoResultQueries(): string[] {
  return searchHistory
    .filter(search => search.resultCount === 0)
    .map(search => search.query)
    .filter((query, index, array) => array.indexOf(query) === index) // Remove duplicates
    .slice(-50); // Last 50 unique no-result queries
}

/**
 * Clear search analytics (for testing or privacy)
 */
export function clearSearchAnalytics(): void {
  searchHistory = [];
  popularQueries.clear();
}

/**
 * Export search data (for backup or analysis)
 */
export function exportSearchData(): {
  history: SearchAnalytics[];
  popular: PopularQuery[];
} {
  return {
    history: [...searchHistory],
    popular: Array.from(popularQueries.values()),
  };
}

/**
 * Import search data (for restore or migration)
 */
export function importSearchData(data: {
  history: SearchAnalytics[];
  popular: PopularQuery[];
}): void {
  searchHistory = data.history.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp),
  }));

  popularQueries.clear();
  data.popular.forEach(item => {
    popularQueries.set(item.query, {
      ...item,
      lastSearched: new Date(item.lastSearched),
    });
  });
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(partialQuery: string, limit: number = 5): string[] {
  const query = partialQuery.toLowerCase().trim();
  if (query.length < 2) return [];

  const suggestions = Array.from(popularQueries.keys())
    .filter(popularQuery => popularQuery.includes(query))
    .sort((a, b) => {
      const aQuery = popularQueries.get(a)!;
      const bQuery = popularQueries.get(b)!;
      return bQuery.count - aQuery.count;
    })
    .slice(0, limit);

  return suggestions;
}

/**
 * Track search result click (for relevance analysis)
 */
export function trackSearchResultClick(
  query: string,
  resultUrl: string,
  resultPosition: number
): void {
  // In production, this would track which results users click
  // to improve search relevance and ranking
  console.log(`Result clicked: "${query}" -> ${resultUrl} (position ${resultPosition})`);
}