import { NavigationItem, NavigationSection } from '@/types/docs';

/**
 * Utility functions for documentation navigation
 */

/**
 * Check if a navigation item is active based on the current pathname
 */
export function isNavigationItemActive(item: NavigationItem, pathname: string): boolean {
  // Exact match
  if (pathname === item.href) {
    return true;
  }
  
  // Check if pathname starts with item href (for parent sections)
  if (pathname.startsWith(item.href + '/')) {
    return true;
  }
  
  // Check children recursively
  if (item.children) {
    return item.children.some(child => isNavigationItemActive(child, pathname));
  }
  
  return false;
}

/**
 * Find the active section based on the current pathname
 */
export function findActiveSection(sections: NavigationSection[], pathname: string): NavigationSection | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavigationItemActive(item, pathname)) {
        return section;
      }
    }
  }
  return null;
}

/**
 * Find the active navigation item based on the current pathname
 */
export function findActiveNavigationItem(sections: NavigationSection[], pathname: string): NavigationItem | null {
  for (const section of sections) {
    const activeItem = findActiveItemInSection(section.items, pathname);
    if (activeItem) {
      return activeItem;
    }
  }
  return null;
}

/**
 * Recursively find active item in a list of navigation items
 */
function findActiveItemInSection(items: NavigationItem[], pathname: string): NavigationItem | null {
  for (const item of items) {
    if (isNavigationItemActive(item, pathname)) {
      // If this item has children, try to find a more specific match
      if (item.children) {
        const childMatch = findActiveItemInSection(item.children, pathname);
        return childMatch || item;
      }
      return item;
    }
  }
  return null;
}

/**
 * Get all parent items for a given navigation item
 */
export function getNavigationItemParents(sections: NavigationSection[], targetItem: NavigationItem): NavigationItem[] {
  const parents: NavigationItem[] = [];
  
  function findParents(items: NavigationItem[], target: NavigationItem, currentParents: NavigationItem[]): boolean {
    for (const item of items) {
      if (item === target) {
        parents.push(...currentParents);
        return true;
      }
      
      if (item.children) {
        if (findParents(item.children, target, [...currentParents, item])) {
          return true;
        }
      }
    }
    return false;
  }
  
  for (const section of sections) {
    if (findParents(section.items, targetItem, [])) {
      break;
    }
  }
  
  return parents;
}

/**
 * Get breadcrumb items for the current pathname
 */
export function getBreadcrumbsFromPath(pathname: string): Array<{ title: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ title: string; href: string }> = [];
  
  // Skip if we're on the docs home page
  if (segments.length <= 1) {
    return breadcrumbs;
  }
  
  // Enhanced breadcrumb mapping for better titles
  const titleMap: Record<string, string> = {
    'docs': 'Documentation',
    'getting-started': 'Getting Started',
    'overview': 'Platform Overview',
    'admin-guide': 'Admin Guide',
    'members': 'Members',
    'management': 'Management',
    'settings': 'Settings',
    'features': 'Features',
    'security': 'Security & Compliance',
    'invites': 'Inviting Members',
    'pending': 'Pending Members',
    'directory': 'Member Directory',
    'events': 'Events',
    'finance': 'Finance',
    'broadcasts': 'Broadcasts',
    'files': 'Files',
    'gallery': 'Gallery',
    'treasury': 'Treasury',
    'chapter': 'Chapter Settings',
    'billing': 'Billing',
    'data-protection': 'Data Protection',
    'compliance': 'Compliance',
    'communication': 'Communication',
    'analytics': 'Analytics',
    'search': 'Search Results',
    'pricing': 'Pricing Plans',
    'roi-calculator': 'ROI Calculator',
    'success-stories': 'Success Stories',
    'demo-videos': 'Demo Videos',
  };
  
  // Always start with docs home
  breadcrumbs.push({ title: 'Documentation', href: '/docs' });
  
  // Build breadcrumbs from path segments
  let currentPath = '';
  for (let i = 1; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const fullPath = `/docs${currentPath}`;
    
    // Use mapped title or convert segment to readable title
    const title = titleMap[segments[i]] || 
      segments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    breadcrumbs.push({ title, href: fullPath });
  }
  
  return breadcrumbs;
}

/**
 * Check if a navigation item should be expanded based on the current path
 */
export function shouldExpandNavigationItem(item: NavigationItem, pathname: string): boolean {
  if (!item.children) {
    return false;
  }
  
  // Expand if any child is active
  return item.children.some(child => isNavigationItemActive(child, pathname));
}