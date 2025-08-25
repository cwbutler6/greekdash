import { describe, it, expect } from 'vitest';
import { searchDocumentation } from '@/lib/docs-search';

describe('Search Integration', () => {
  it('should handle basic search functionality', () => {
    // Create a mock search index
    const mockIndex = {
      pages: [
        {
          slug: 'member-management',
          title: 'Member Management Guide',
          description: 'Complete guide to managing chapter members',
          content: 'Learn how to invite members, manage roles, and handle member communications. This guide covers everything from sending invitations to managing member permissions and roles.',
          section: 'admin-guide',
          subsection: 'members',
          tags: ['members', 'management', 'roles'],
          weight: 2,
          url: '/docs/admin-guide/members'
        },
        {
          slug: 'dues-collection',
          title: 'Dues Collection Setup',
          description: 'Set up automated dues collection',
          content: 'Configure dues plans, payment processing, and automated reminders for chapter dues collection.',
          section: 'admin-guide',
          subsection: 'finance',
          tags: ['dues', 'payments', 'finance'],
          weight: 2,
          url: '/docs/admin-guide/finance/dues'
        },
        {
          slug: 'getting-started',
          title: 'Getting Started',
          description: 'Quick start guide for new administrators',
          content: 'Welcome to GreekDash! This guide will help you get started with managing your chapter.',
          section: 'getting-started',
          tags: ['onboarding', 'setup'],
          weight: 3,
          url: '/docs/getting-started'
        }
      ],
      terms: new Map([
        ['member', ['member-management']],
        ['members', ['member-management']],
        ['management', ['member-management']],
        ['dues', ['dues-collection']],
        ['collection', ['dues-collection']],
        ['payments', ['dues-collection']],
        ['getting', ['getting-started']],
        ['started', ['getting-started']],
        ['guide', ['member-management', 'dues-collection', 'getting-started']],
        ['chapter', ['member-management', 'getting-started']],
      ])
    };

    // Test exact match
    const memberResults = searchDocumentation('member', mockIndex);
    expect(memberResults).toHaveLength(1);
    expect(memberResults[0].title).toBe('Member Management Guide');
    expect(memberResults[0].type).toBe('guide');
    expect(memberResults[0].section).toBe('Admin Guide');

    // Test multiple results
    const guideResults = searchDocumentation('guide', mockIndex);
    expect(guideResults.length).toBeGreaterThan(1);
    
    // Results should be sorted by score (weight * matches)
    expect(guideResults[0].title).toBe('Getting Started'); // Higher weight
    
    // Test no results
    const noResults = searchDocumentation('nonexistent', mockIndex);
    expect(noResults).toHaveLength(0);

    // Test empty query
    const emptyResults = searchDocumentation('', mockIndex);
    expect(emptyResults).toHaveLength(0);

    // Test whitespace query
    const whitespaceResults = searchDocumentation('   ', mockIndex);
    expect(whitespaceResults).toHaveLength(0);
  });

  it('should generate proper excerpts', () => {
    const mockIndex = {
      pages: [
        {
          slug: 'test-page',
          title: 'Test Page',
          description: 'Test description',
          content: 'This is some content before the important keyword that we are searching for and some content after it to test excerpt generation.',
          section: 'test',
          tags: [],
          weight: 1,
          url: '/docs/test'
        }
      ],
      terms: new Map([
        ['keyword', ['test-page']]
      ])
    };

    const results = searchDocumentation('keyword', mockIndex);
    
    expect(results).toHaveLength(1);
    expect(results[0].excerpt).toContain('keyword');
    expect(results[0].excerpt.length).toBeLessThanOrEqual(203); // 200 + ellipsis
  });

  it('should handle section and type mapping correctly', () => {
    const mockIndex = {
      pages: [
        {
          slug: 'admin-feature',
          title: 'Admin Feature',
          description: 'Admin guide feature',
          content: 'Test content',
          section: 'admin-guide',
          subsection: 'member-management',
          tags: [],
          weight: 1,
          url: '/docs/admin-guide/feature'
        },
        {
          slug: 'feature-showcase',
          title: 'Feature Showcase',
          description: 'Feature showcase',
          content: 'Test content',
          section: 'features',
          tags: [],
          weight: 1,
          url: '/docs/features/showcase'
        }
      ],
      terms: new Map([
        ['test', ['admin-feature', 'feature-showcase']]
      ])
    };

    const results = searchDocumentation('test', mockIndex);
    
    expect(results).toHaveLength(2);
    
    const adminResult = results.find(r => r.title === 'Admin Feature');
    const featureResult = results.find(r => r.title === 'Feature Showcase');
    
    expect(adminResult?.section).toBe('Admin Guide');
    expect(adminResult?.subsection).toBe('Member Management');
    expect(adminResult?.type).toBe('guide');
    
    expect(featureResult?.section).toBe('Features');
    expect(featureResult?.type).toBe('feature');
  });
});