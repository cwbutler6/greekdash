'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TOCItem } from '@/types/docs';

interface MobileTableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export function MobileTableOfContents({ items, className }: MobileTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);

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

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (tocRef.current) {
        const rect = tocRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 80); // Account for header height
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Account for mobile header height
      const headerHeight = 64;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    
    // Close TOC after selection on mobile
    setIsOpen(false);
  };

  if (!items || items.length === 0) {
    return null;
  }

  // Filter to show only top-level items for mobile
  const topLevelItems = items.filter(item => item.level <= 3);
  const activeItem = topLevelItems.find(item => item.id === activeId);

  return (
    <div 
      ref={tocRef}
      className={cn(
        'lg:hidden', // Only show on mobile
        isSticky && 'sticky top-16 z-30',
        className
      )}
    >
      <Card className={cn(
        'mx-4 mb-4',
        isSticky && 'shadow-lg'
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto text-left"
            >
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="font-medium">
                  {activeItem ? activeItem.title : 'Table of Contents'}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <nav className="space-y-1">
                {topLevelItems.map((item) => (
                  <TOCItemComponent
                    key={item.id}
                    item={item}
                    activeId={activeId}
                    onItemClick={handleClick}
                    isMobile={true}
                  />
                ))}
              </nav>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

/**
 * Floating TOC button for mobile - shows current section
 */
export function FloatingTOC({ items, className }: MobileTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 200); // Show after scrolling 200px
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 64;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    
    setIsOpen(false);
  };

  if (!items || items.length === 0 || !isVisible) {
    return null;
  }

  const topLevelItems = items.filter(item => item.level <= 3);
  const activeItem = topLevelItems.find(item => item.id === activeId);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating TOC */}
      <div className={cn('lg:hidden', className)}>
        {/* Floating Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'fixed bottom-6 right-6 z-50 h-14 px-4 shadow-lg transition-all duration-300',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          )}
          aria-label="Toggle table of contents"
        >
          <List className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium max-w-32 truncate">
            {activeItem ? activeItem.title : 'Contents'}
          </span>
        </Button>

        {/* TOC Panel */}
        {isOpen && (
          <Card className="fixed bottom-24 right-6 left-6 z-50 max-h-80 overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Table of Contents
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto p-4">
                <nav className="space-y-1">
                  {topLevelItems.map((item) => (
                    <TOCItemComponent
                      key={item.id}
                      item={item}
                      activeId={activeId}
                      onItemClick={handleClick}
                      isMobile={true}
                    />
                  ))}
                </nav>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

interface TOCItemComponentProps {
  item: TOCItem;
  activeId: string;
  onItemClick: (id: string) => void;
  level?: number;
  isMobile?: boolean;
}

function TOCItemComponent({ 
  item, 
  activeId, 
  onItemClick, 
  level = 0,
  isMobile = false
}: TOCItemComponentProps) {
  const isActive = activeId === item.id;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onItemClick(item.id)}
        className={cn(
          'block w-full text-left transition-colors hover:text-foreground rounded-md',
          isActive 
            ? 'text-foreground font-medium bg-accent' 
            : 'text-muted-foreground hover:bg-accent/50',
          isMobile ? 'text-base py-3 px-3 min-h-[44px]' : 'text-sm py-2 px-2', // Larger touch targets on mobile
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 12 + (isMobile ? 12 : 8)}px` }}
      >
        <span className="truncate">{item.title}</span>
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
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}