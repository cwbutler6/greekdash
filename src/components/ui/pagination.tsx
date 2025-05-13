'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams();
  
  // Create a new URLSearchParams instance to handle query parameters
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Generate page numbers to display
  const generatePagination = () => {
    // Always show first and last page, and up to 3 pages around the current page
    const pages = [];
    
    if (totalPages <= 7) {
      // If we have 7 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include the first page
      pages.push(1);
      
      // If current page is close to the start
      if (currentPage <= 3) {
        pages.push(2, 3, 4, null, totalPages);
      } 
      // If current page is close to the end
      else if (currentPage >= totalPages - 2) {
        pages.push(
          null,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } 
      // If current page is in the middle
      else {
        pages.push(
          null,
          currentPage - 1,
          currentPage,
          currentPage + 1,
          null,
          totalPages
        );
      }
    }
    
    return pages;
  };
  
  const pages = generatePagination();
  
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageUrl(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </Button>
      
      {pages.map((page, i) => {
        // If the page is null, it's a separator
        if (page === null) {
          return (
            <Button
              key={`separator-${i}`}
              variant="outline"
              size="icon"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        // Otherwise, it's a page number
        return (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            asChild={currentPage !== page}
          >
            {currentPage !== page ? (
              <Link href={createPageUrl(page as number)} aria-label={`Page ${page}`}>
                {page}
              </Link>
            ) : (
              <span>{page}</span>
            )}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageUrl(currentPage + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
