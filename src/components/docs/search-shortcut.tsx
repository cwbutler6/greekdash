'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocsSearch } from './docs-search';
import { cn } from '@/lib/utils';


interface SearchShortcutProps {
  className?: string;
}

export function SearchShortcut({ className }: SearchShortcutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Detect operating system
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Also handle '/' key for quick search
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if an input element is currently focused
  const isInputFocused = () => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );
  };

  const handleResultSelect = () => {
    setIsOpen(false);
    // Navigation is handled by the DocsSearch component
  };

  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <>
      {/* Search Button */}
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search documentation...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">{shortcutKey}</span>
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-semibold">
              Search Documentation
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <DocsSearch
              placeholder="Type to search..."
              showResults={true}
              onResultSelect={handleResultSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact search button for mobile/small screens
 */
export function SearchShortcutCompact({ className }: SearchShortcutProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleResultSelect = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-9 w-9 p-0", className)}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Search documentation</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-semibold">
              Search Documentation
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <DocsSearch
              placeholder="Type to search..."
              showResults={true}
              onResultSelect={handleResultSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}