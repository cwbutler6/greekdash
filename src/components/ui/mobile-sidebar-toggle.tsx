'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileSidebarToggleProps {
  chapterSlug: string;
}

export function MobileSidebarToggle({ chapterSlug }: MobileSidebarToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    
    // Toggle sidebar visibility by adding/removing a class to the sidebar element
    const sidebar = document.getElementById(`mobile-sidebar-${chapterSlug}`);
    if (sidebar) {
      if (!isOpen) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('block');
      } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('block');
      }
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleSidebar}
      className="md:hidden text-white hover:bg-emerald-700"
      aria-label="Toggle sidebar navigation"
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
    </Button>
  );
}
