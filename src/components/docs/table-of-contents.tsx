'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TOCItem } from '@/types/docs';

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      headings.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading);
        }
      });
    };
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="font-semibold text-sm text-foreground mb-4">
        On This Page
      </h4>
      <nav className="space-y-1">
        {items.map((item) => (
          <TOCItemComponent
            key={item.id}
            item={item}
            activeId={activeId}
            onItemClick={handleClick}
          />
        ))}
      </nav>
    </div>
  );
}

interface TOCItemComponentProps {
  item: TOCItem;
  activeId: string;
  onItemClick: (id: string) => void;
  level?: number;
}

function TOCItemComponent({ 
  item, 
  activeId, 
  onItemClick, 
  level = 0 
}: TOCItemComponentProps) {
  const isActive = activeId === item.id;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onItemClick(item.id)}
        className={cn(
          'block w-full text-left text-sm transition-colors hover:text-foreground',
          isActive 
            ? 'text-foreground font-medium' 
            : 'text-muted-foreground',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        {item.title}
      </button>
      
      {hasChildren && (
        <div className="mt-1">
          {item.children!.map((child) => (
            <TOCItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to generate table of contents from page content
 */
export function useTableOfContents(): TOCItem[] {
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    const generateTOC = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const items: TOCItem[] = [];

      headings.forEach((heading) => {
        if (heading.id && heading.textContent) {
          const level = parseInt(heading.tagName.charAt(1));
          items.push({
            id: heading.id,
            title: heading.textContent,
            level,
          });
        }
      });

      // Build hierarchical structure
      const buildHierarchy = (items: TOCItem[]): TOCItem[] => {
        const result: TOCItem[] = [];
        const stack: TOCItem[] = [];

        for (const item of items) {
          // Remove items from stack that are at same or deeper level
          while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
            stack.pop();
          }

          if (stack.length === 0) {
            // Top level heading
            result.push(item);
          } else {
            // Child heading
            const parent = stack[stack.length - 1];
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(item);
          }

          stack.push(item);
        }

        return result;
      };

      setToc(buildHierarchy(items));
    };

    // Generate TOC after component mounts and content is rendered
    const timer = setTimeout(generateTOC, 100);

    return () => clearTimeout(timer);
  }, []);

  return toc;
}

/**
 * Compact table of contents for mobile/sidebar use
 */
export function CompactTableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0,
      }
    );

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      headings.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading);
        }
      });
    };
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  // Only show top-level items in compact view
  const topLevelItems = items.filter(item => item.level <= 3);

  return (
    <div className={cn('space-y-1', className)}>
      {topLevelItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={cn(
            'block w-full text-left text-xs transition-colors hover:text-foreground truncate',
            activeId === item.id 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground'
          )}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}