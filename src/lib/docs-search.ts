export interface SearchIndexPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  section: string;
  subsection?: string;
  tags: string[];
  weight: number;
  url: string;
}

export interface SearchResult {
  title: string;
  excerpt: string;
  url: string;
  section: string;
  subsection?: string;
  type: 'guide' | 'feature' | 'api';
  score: number;
}

export interface SearchIndex {
  pages: SearchIndexPage[];
  terms: Map<string, string[]>; // term -> page slugs
}

interface SearchIndexResponse {
  pages: SearchIndexPage[];
  terms: Record<string, string[]>; // JSON serialized version
}

// Cache for search index
let searchIndexCache: SearchIndex | null = null;
let searchIndexPromise: Promise<SearchIndex> | null = null;

/**
 * Fetch search index from API endpoint
 */
export async function fetchSearchIndex(): Promise<SearchIndex> {
  // Return cached index if available
  if (searchIndexCache) {
    return searchIndexCache;
  }

  // Return existing promise if already fetching
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  // Create new fetch promise
  searchIndexPromise = (async () => {
    try {
      const response = await fetch('/api/docs/search-index');
      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status}`);
      }

      const data: SearchIndexResponse = await response.json();
      
      // Convert terms object back to Map
      const terms = new Map<string, string[]>();
      for (const [term, pages] of Object.entries(data.terms)) {
        terms.set(term, pages);
      }

      const searchIndex: SearchIndex = {
        pages: data.pages,
        terms,
      };

      // Cache the result
      searchIndexCache = searchIndex;
      return searchIndex;
    } catch (error) {
      console.error('Failed to fetch search index:', error);
      
      // Return empty index on error
      const emptyIndex: SearchIndex = {
        pages: [],
        terms: new Map(),
      };
      
      searchIndexCache = emptyIndex;
      return emptyIndex;
    } finally {
      // Clear the promise so future calls can retry
      searchIndexPromise = null;
    }
  })();

  return searchIndexPromise;
}

/**
 * Generate search index (client-side wrapper that fetches from API)
 */
export async function generateSearchIndex(): Promise<SearchIndex> {
  return fetchSearchIndex();
}

/**
 * Search through the documentation index
 */
export function searchDocumentation(query: string, searchIndex: SearchIndex): SearchResult[] {
  if (!query.trim()) return [];

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.replace(/[^\w]/g, ''))
    .filter(term => term.length > 0);

  if (queryTerms.length === 0) return [];

  // Find pages that match query terms
  const pageScores = new Map<string, number>();

  for (const term of queryTerms) {
    // Find exact matches
    const exactMatches = searchIndex.terms.get(term) || [];
    for (const pageSlug of exactMatches) {
      pageScores.set(pageSlug, (pageScores.get(pageSlug) || 0) + 10);
    }

    // Find partial matches
    for (const [indexTerm, pageList] of searchIndex.terms.entries()) {
      if (indexTerm.includes(term) && indexTerm !== term) {
        for (const pageSlug of pageList) {
          pageScores.set(pageSlug, (pageScores.get(pageSlug) || 0) + 5);
        }
      }
    }
  }

  // Convert to results with page data
  const results: SearchResult[] = [];
  
  for (const [pageSlug, score] of pageScores.entries()) {
    const page = searchIndex.pages.find(p => p.slug === pageSlug);
    if (!page) continue;

    // Apply page weight to score
    const finalScore = score * page.weight;

    // Generate excerpt with highlighted terms
    const excerpt = generateExcerpt(page.content, queryTerms);

    // Determine type based on section
    let type: 'guide' | 'feature' | 'api' = 'guide';
    if (page.section === 'features') type = 'feature';
    if (page.section === 'api') type = 'api';

    results.push({
      title: page.title,
      excerpt,
      url: page.url,
      section: formatSectionName(page.section),
      subsection: page.subsection ? formatSectionName(page.subsection) : undefined,
      type,
      score: finalScore,
    });
  }

  // Sort by score (highest first) and return top 20 results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Generate excerpt with context around search terms
 */
function generateExcerpt(content: string, queryTerms: string[]): string {
  const maxLength = 200;
  const contextLength = 50;

  // Find first occurrence of any query term
  let bestMatch = -1;
  let bestTerm = '';

  for (const term of queryTerms) {
    const index = content.toLowerCase().indexOf(term);
    if (index !== -1 && (bestMatch === -1 || index < bestMatch)) {
      bestMatch = index;
      bestTerm = term;
    }
  }

  if (bestMatch === -1) {
    // No terms found, return beginning of content
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  // Extract context around the match
  const start = Math.max(0, bestMatch - contextLength);
  const end = Math.min(content.length, bestMatch + bestTerm.length + contextLength);
  
  let excerpt = content.substring(start, end);
  
  // Add ellipsis if we're not at the beginning/end
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  return excerpt.trim();
}

/**
 * Format section names for display
 */
function formatSectionName(section: string): string {
  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get popular search queries
 */
export function getPopularQueries(): string[] {
  // Fallback to default queries (analytics integration can be added later)
  return [
    'member management',
    'dues collection',
    'event creation',
    'financial reports',
    'member invites',
    'chapter settings',
    'payment processing',
    'member roles',
  ];
}

/**
 * Track search query
 */
export function trackSearchQuery(query: string, resultCount: number): void {
  // Simple logging for now (analytics integration can be added later)
  console.log(`Search: "${query}" - ${resultCount} results`);
}