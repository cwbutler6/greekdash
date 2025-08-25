'use client';

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocsMobileSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function DocsMobileSidebarToggle({ 
  isOpen, 
  onToggle, 
  className 
}: DocsMobileSidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("lg:hidden", className)}
      onClick={onToggle}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="docs-sidebar"
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </Button>
  );
}