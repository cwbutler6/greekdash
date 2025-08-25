import { describe, it, expect } from 'vitest';
import { 
  isNavigationItemActive, 
  shouldExpandNavigationItem,
  getBreadcrumbsFromPath 
} from '@/lib/docs-navigation';
import { NavigationItem } from '@/types/docs';

describe('Documentation Navigation', () => {
  describe('Navigation Utilities', () => {
    const mockNavigationItem: NavigationItem = {
      title: 'Admin Guide',
      href: '/docs/admin-guide',
      children: [
        {
          title: 'Members',
          href: '/docs/admin-guide/members',
          children: [
            {
              title: 'Inviting Members',
              href: '/docs/admin-guide/members/invites',
            },
          ],
        },
      ],
    };

    describe('isNavigationItemActive', () => {
      it('should return true for exact path match', () => {
        expect(isNavigationItemActive(mockNavigationItem, '/docs/admin-guide')).toBe(true);
      });

      it('should return true for child path match', () => {
        expect(isNavigationItemActive(mockNavigationItem, '/docs/admin-guide/members')).toBe(true);
      });

      it('should return true for nested child path match', () => {
        expect(isNavigationItemActive(mockNavigationItem, '/docs/admin-guide/members/invites')).toBe(true);
      });

      it('should return false for unrelated path', () => {
        expect(isNavigationItemActive(mockNavigationItem, '/docs/features')).toBe(false);
      });
    });

    describe('shouldExpandNavigationItem', () => {
      it('should return true when child is active', () => {
        expect(shouldExpandNavigationItem(mockNavigationItem, '/docs/admin-guide/members')).toBe(true);
      });

      it('should return false when no children are active', () => {
        expect(shouldExpandNavigationItem(mockNavigationItem, '/docs/features')).toBe(false);
      });

      it('should return false for items without children', () => {
        const itemWithoutChildren: NavigationItem = {
          title: 'Features',
          href: '/docs/features',
        };
        expect(shouldExpandNavigationItem(itemWithoutChildren, '/docs/features')).toBe(false);
      });
    });

    describe('getBreadcrumbsFromPath', () => {
      it('should return empty array for docs home page', () => {
        expect(getBreadcrumbsFromPath('/docs')).toEqual([]);
      });

      it('should generate correct breadcrumbs for nested path', () => {
        const breadcrumbs = getBreadcrumbsFromPath('/docs/admin-guide/members/invites');
        expect(breadcrumbs).toEqual([
          { title: 'Documentation', href: '/docs' },
          { title: 'Admin Guide', href: '/docs/admin-guide' },
          { title: 'Members', href: '/docs/admin-guide/members' },
          { title: 'Inviting Members', href: '/docs/admin-guide/members/invites' },
        ]);
      });

      it('should handle unknown segments gracefully', () => {
        const breadcrumbs = getBreadcrumbsFromPath('/docs/unknown-section');
        expect(breadcrumbs).toEqual([
          { title: 'Documentation', href: '/docs' },
          { title: 'Unknown Section', href: '/docs/unknown-section' },
        ]);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should correctly identify active navigation paths', () => {
      const mockItem: NavigationItem = {
        title: 'Admin Guide',
        href: '/docs/admin-guide',
        children: [
          {
            title: 'Members',
            href: '/docs/admin-guide/members',
          },
        ],
      };

      // Test various path scenarios
      expect(isNavigationItemActive(mockItem, '/docs/admin-guide')).toBe(true);
      expect(isNavigationItemActive(mockItem, '/docs/admin-guide/members')).toBe(true);
      expect(isNavigationItemActive(mockItem, '/docs/features')).toBe(false);
    });

    it('should generate proper breadcrumb structure', () => {
      const breadcrumbs = getBreadcrumbsFromPath('/docs/admin-guide/members/invites');
      
      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs[0]).toEqual({ title: 'Documentation', href: '/docs' });
      expect(breadcrumbs[1]).toEqual({ title: 'Admin Guide', href: '/docs/admin-guide' });
      expect(breadcrumbs[2]).toEqual({ title: 'Members', href: '/docs/admin-guide/members' });
      expect(breadcrumbs[3]).toEqual({ title: 'Inviting Members', href: '/docs/admin-guide/members/invites' });
    });
  });
});