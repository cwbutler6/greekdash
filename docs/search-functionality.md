# Documentation Search Functionality

This document describes the comprehensive search functionality implemented for the GreekDash documentation site.

## Overview

The search system provides real-time, client-side search capabilities with advanced features including:

- **Real-time search** with debounced queries
- **Keyboard navigation** for accessibility
- **Search analytics** for tracking and improvement
- **Filtering and categorization** of results
- **Contextual excerpts** with highlighted terms
- **Popular queries** and suggestions

## Architecture

### Core Components

#### 1. Search Index Generation (`src/lib/docs-search.ts`)

The search system generates a client-side index from MDX files in the `docs-content` directory:

```typescript
interface SearchIndexPage {
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
```

**Features:**
- Parses MDX frontmatter for metadata
- Generates searchable terms from content
- Assigns relevance weights based on section importance
- Creates URL mappings for navigation

#### 2. Search Component (`src/components/docs/docs-search.tsx`)

Interactive search component with real-time results:

```typescript
interface DocsSearchProps {
  placeholder?: string;
  showResults?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}
```

**Features:**
- Debounced search queries (300ms delay)
- Keyboard navigation (arrow keys, enter, escape)
- Loading states and error handling
- Responsive dropdown with results
- Accessibility support (ARIA labels, screen reader friendly)

#### 3. Search Results Page (`src/components/docs/docs-search-page.tsx`)

Comprehensive search results page with advanced filtering:

**Features:**
- Filter by section (Admin Guide, Getting Started, etc.)
- Filter by content type (Guide, Feature, API)
- Sort by relevance or alphabetical
- Popular searches tab
- Search analytics integration

#### 4. Search Analytics (`src/lib/search-analytics.ts`)

Tracks search behavior for insights and improvements:

```typescript
interface SearchAnalytics {
  query: string;
  timestamp: Date;
  resultCount: number;
  userAgent?: string;
  sessionId?: string;
}
```

**Capabilities:**
- Track search queries and result counts
- Identify popular search terms
- Monitor no-result queries for content gaps
- Generate search suggestions
- Export/import analytics data

### Search Algorithm

The search algorithm uses a multi-stage approach:

1. **Term Extraction**: Split query into individual terms
2. **Exact Matching**: Find pages containing exact term matches (10 points)
3. **Partial Matching**: Find pages with terms containing query terms (5 points)
4. **Weight Application**: Multiply scores by page weight
5. **Sorting**: Sort by final score (highest first)
6. **Limiting**: Return top 20 results

### Relevance Scoring

Pages are assigned weights based on importance:

- **Getting Started**: Weight 3 (highest priority)
- **Admin Guide**: Weight 2 (high priority)
- **Other sections**: Weight 1 (standard priority)
- **Tagged as "important"**: +1 bonus weight

## Usage

### Basic Search

```tsx
import { DocsSearch } from '@/components/docs/docs-search';

// Simple search with dropdown results
<DocsSearch placeholder="Search documentation..." />

// Search without dropdown (header usage)
<DocsSearch showResults={false} />

// Search with custom result handler
<DocsSearch onResultSelect={(result) => handleResult(result)} />
```

### Search with Keyboard Shortcut

```tsx
import { SearchShortcut } from '@/components/docs/search-shortcut';

// Full search button with Cmd/Ctrl+K shortcut
<SearchShortcut />

// Compact search button for mobile
<SearchShortcutCompact />
```

### Search Results Page

The search results page is automatically available at `/docs/search` and supports URL parameters:

- `?q=query` - Pre-populate search query
- Filters and sorting are managed via component state

### Analytics Integration

```typescript
import { trackSearchQuery, getPopularQueries } from '@/lib/docs-search';

// Track a search query
trackSearchQuery('member management', 5);

// Get popular queries for suggestions
const popular = getPopularQueries();
```

## Content Structure

### MDX Frontmatter

Documentation files should include comprehensive frontmatter:

```yaml
---
title: "Page Title"
description: "Page description for search results"
section: "admin-guide"
subsection: "members"
author: "Author Name"
tags: ["tag1", "tag2", "tag3"]
prerequisites: ["other-page-slug"]
planRequired: "FREE" | "BASIC" | "PRO"
lastUpdated: "2025-01-25"
relatedPages: ["related-page-1", "related-page-2"]
---
```

### Directory Structure

```
docs-content/
├── getting-started/
│   ├── index.mdx
│   ├── first-login.mdx
│   └── chapter-setup.mdx
├── admin-guide/
│   ├── members/
│   │   ├── invites.mdx
│   │   ├── pending.mdx
│   │   └── directory.mdx
│   └── finance/
│       ├── dues.mdx
│       └── expenses.mdx
└── features/
    ├── member-management.mdx
    └── financial-tools.mdx
```

## Performance Considerations

### Client-Side Index

The search index is generated at build time and loaded on the client:

- **Pros**: Fast search, no server requests, works offline
- **Cons**: Initial bundle size, memory usage
- **Mitigation**: Index only essential content, lazy load if needed

### Search Optimization

- **Debounced queries**: Prevent excessive search operations
- **Term filtering**: Only index words longer than 2 characters
- **Result limiting**: Maximum 20 results to prevent UI overload
- **Memory management**: Limit analytics history to 1000 entries

## Accessibility

### Keyboard Navigation

- **Tab**: Focus search input
- **Arrow Down/Up**: Navigate through results
- **Enter**: Select highlighted result or submit search
- **Escape**: Close dropdown and blur input

### Screen Reader Support

- **ARIA labels**: Descriptive labels for all interactive elements
- **Live regions**: Announce result counts and status changes
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Focus management**: Logical tab order and focus indicators

## Testing

### Unit Tests

```bash
# Run search functionality tests
pnpm test src/__tests__/docs-search.test.ts

# Run integration tests
pnpm test src/__tests__/search-integration.test.ts
```

### Test Coverage

- Search index generation
- Query processing and scoring
- Result formatting and excerpts
- Analytics tracking
- Component interactions
- Keyboard navigation
- Error handling

## Deployment

### Build Process

The search index is generated during the build process:

1. **Content Discovery**: Scan `docs-content` directory
2. **MDX Processing**: Parse frontmatter and content
3. **Index Generation**: Create searchable terms and mappings
4. **Bundle Integration**: Include index in client bundle

### Environment Variables

No additional environment variables required. The search system works entirely client-side.

## Monitoring and Analytics

### Search Metrics

Track these metrics for search improvement:

- **Query volume**: Total searches per day/week
- **Success rate**: Percentage of searches with results
- **Popular queries**: Most common search terms
- **No-result queries**: Searches that return no results
- **Click-through rate**: Results that users actually click

### Content Gap Analysis

Use analytics to identify content needs:

- **High-volume no-result queries**: Content to create
- **Popular but low-scoring queries**: Content to improve
- **Trending searches**: Emerging user needs

## Future Enhancements

### Planned Features

1. **Fuzzy Search**: Handle typos and similar terms
2. **Search Filters**: Advanced filtering options
3. **Search History**: Personal search history
4. **Bookmarking**: Save favorite search results
5. **AI-Powered Suggestions**: Intelligent query suggestions

### Performance Improvements

1. **Index Compression**: Reduce bundle size
2. **Progressive Loading**: Load index incrementally
3. **Service Worker**: Cache search index offline
4. **Search API**: Optional server-side search for large sites

## Troubleshooting

### Common Issues

**Search not working**
- Check if `docs-content` directory exists
- Verify MDX files have proper frontmatter
- Ensure gray-matter dependency is installed

**No results for valid queries**
- Check search index generation in browser console
- Verify content contains searchable terms
- Check for JavaScript errors in browser console

**Performance issues**
- Monitor search index size
- Check for memory leaks in analytics
- Optimize content and reduce index size

### Debug Mode

Enable debug logging by setting localStorage:

```javascript
localStorage.setItem('docs-search-debug', 'true');
```

This will log search operations and performance metrics to the browser console.