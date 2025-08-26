import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { ResponsiveDocsLayout, useIsMobile } from '@/components/docs/responsive-docs-layout';
import { MobileOptimizedSearch } from '@/components/docs/mobile-optimized-search';
import { MobileOptimizedVideo } from '@/components/docs/mobile-optimized-video';
import { MobileNavigation } from '@/components/docs/mobile-navigation';
import { MobileTableOfContents } from '@/components/docs/mobile-table-of-contents';
import { ProgressiveImage } from '@/components/docs/progressive-image';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/docs/test'),
}));

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock search functions
vi.mock('@/lib/docs-search', () => ({
  searchDocumentation: vi.fn(() => []),
  generateSearchIndex: vi.fn(() => Promise.resolve({ pages: [], terms: [] })),
  trackSearchQuery: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/client-analytics', () => ({
  trackChapterEvent: vi.fn(),
}));

vi.mock('@/lib/video-analytics', () => ({
  trackVideoStart: vi.fn(),
  trackVideoComplete: vi.fn(),
  trackVideoEvent: vi.fn(),
  trackTranscriptInteraction: vi.fn(),
  trackRelatedLinkClick: vi.fn(),
}));

describe('Mobile Responsive Documentation', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ResponsiveDocsLayout', () => {
    it('renders desktop layout on large screens', () => {
      render(
        <ResponsiveDocsLayout>
          <div>Test content</div>
        </ResponsiveDocsLayout>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.getByText('GreekDash')).toBeInTheDocument();
    });

    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <ResponsiveDocsLayout>
          <div>Test content</div>
        </ResponsiveDocsLayout>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('handles sidebar toggle on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <ResponsiveDocsLayout>
          <div>Test content</div>
        </ResponsiveDocsLayout>
      );

      const menuButton = screen.getByLabelText(/toggle navigation/i);
      fireEvent.click(menuButton);

      // Should prevent body scroll when sidebar is open
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('MobileOptimizedSearch', () => {
    it('renders compact search on desktop', () => {
      render(<MobileOptimizedSearch isMobile={false} />);
      
      const searchInput = screen.getByPlaceholderText('Search documentation...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders expanded search interface on mobile', () => {
      render(<MobileOptimizedSearch isMobile={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search documentation...');
      fireEvent.focus(searchInput);

      // Should expand to fullscreen on mobile
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('handles touch interactions properly', () => {
      render(<MobileOptimizedSearch isMobile={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search documentation...');
      
      // Simulate touch events
      fireEvent.touchStart(searchInput);
      fireEvent.focus(searchInput);
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('MobileOptimizedVideo', () => {
    const mockVideoProps = {
      videoId: 'test-video-id',
      title: 'Test Video',
      description: 'Test video description',
      isMobile: true,
    };

    it('renders mobile-optimized video player', () => {
      render(<MobileOptimizedVideo {...mockVideoProps} />);
      
      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByLabelText(/play video/i)).toBeInTheDocument();
    });

    it('shows fullscreen button on mobile', () => {
      render(<MobileOptimizedVideo {...mockVideoProps} />);
      
      expect(screen.getByLabelText(/enter fullscreen/i)).toBeInTheDocument();
    });

    it('handles progressive loading', async () => {
      render(<MobileOptimizedVideo {...mockVideoProps} />);
      
      // Video should not load immediately
      expect(screen.queryByRole('iframe')).not.toBeInTheDocument();
      
      // Click play button
      const playButton = screen.getByLabelText(/play video/i);
      fireEvent.click(playButton);
      
      // Should start loading video
      await waitFor(() => {
        expect(screen.getByTitle('Test Video')).toBeInTheDocument();
      });
    });
  });

  describe('MobileNavigation', () => {
    const mockProps = {
      isOpen: true,
      onToggle: jest.fn(),
      onClose: jest.fn(),
    };

    it('renders mobile navigation sidebar', () => {
      render(<MobileNavigation {...mockProps} />);
      
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('handles swipe gestures', () => {
      render(<MobileNavigation {...mockProps} />);
      
      const sidebar = screen.getByText('Documentation').closest('div');
      
      // Simulate swipe left gesture
      fireEvent.touchStart(sidebar!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(sidebar!, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      fireEvent.touchEnd(sidebar!);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('has proper touch targets', () => {
      render(<MobileNavigation {...mockProps} />);
      
      const navItems = screen.getAllByRole('link');
      navItems.forEach(item => {
        const styles = window.getComputedStyle(item);
        // Should have minimum touch target size
        expect(parseInt(styles.minHeight) >= 44).toBe(true);
      });
    });
  });

  describe('MobileTableOfContents', () => {
    const mockTOCItems = [
      { id: 'section-1', title: 'Section 1', level: 1 },
      { id: 'section-2', title: 'Section 2', level: 2 },
      { id: 'section-3', title: 'Section 3', level: 1 },
    ];

    it('renders collapsible TOC on mobile', () => {
      render(<MobileTableOfContents items={mockTOCItems} />);
      
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    });

    it('handles smooth scrolling to sections', () => {
      // Mock getElementById and scrollIntoView
      const mockElement = {
        getBoundingClientRect: () => ({ top: 100 }),
        scrollIntoView: vi.fn(),
      };
      
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown);
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      render(<MobileTableOfContents items={mockTOCItems} />);
      
      // Open TOC
      const tocButton = screen.getByText('Table of Contents');
      fireEvent.click(tocButton);
      
      // Click on a section
      const sectionButton = screen.getByText('Section 1');
      fireEvent.click(sectionButton);
      
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });
  });

  describe('ProgressiveImage', () => {
    it('implements lazy loading', () => {
      render(
        <ProgressiveImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
        />
      );
      
      // Should show loading placeholder initially
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('handles loading errors gracefully', () => {
      render(
        <ProgressiveImage
          src="/invalid-image.jpg"
          alt="Test image"
          width={400}
          height={300}
        />
      );
      
      const image = screen.getByRole('img', { hidden: true });
      fireEvent.error(image);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });

    it('uses appropriate sizes for mobile', () => {
      render(
        <ProgressiveImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );
      
      const image = screen.getByRole('img', { hidden: true });
      expect(image).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    });
  });

  describe('Touch Gesture Handling', () => {
    it('prevents default touch behaviors when needed', () => {
      const TestComponent = () => {
        const handleTouchStart = (e: React.TouchEvent) => {
          e.preventDefault();
        };

        return (
          <div onTouchStart={handleTouchStart} data-testid="touch-element">
            Touch me
          </div>
        );
      };

      render(<TestComponent />);
      
      const element = screen.getByTestId('touch-element');
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      const preventDefaultSpy = vi.spyOn(touchEvent, 'preventDefault');
      fireEvent(element, touchEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility on Mobile', () => {
    it('maintains proper focus management', () => {
      render(
        <ResponsiveDocsLayout>
          <button>Test button</button>
        </ResponsiveDocsLayout>
      );
      
      const button = screen.getByRole('button', { name: 'Test button' });
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('provides proper ARIA labels for mobile controls', () => {
      render(<MobileOptimizedSearch isMobile={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search documentation...');
      fireEvent.focus(searchInput);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });
});

describe('useIsMobile hook', () => {
  it('detects mobile viewport correctly', () => {
    let isMobile: boolean;
    
    const TestComponent = () => {
      isMobile = useIsMobile();
      return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
    };

    // Test desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { rerender } = render(<TestComponent />);
    expect(screen.getByText('Desktop')).toBeInTheDocument();

    // Test mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Trigger resize event
    fireEvent(window, new Event('resize'));
    rerender(<TestComponent />);
    
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });
});