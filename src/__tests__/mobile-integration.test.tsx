import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResponsiveDocsLayout } from '@/components/docs/responsive-docs-layout';
import { ProgressiveImage } from '@/components/docs/progressive-image';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
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

// Mock search functions
vi.mock('@/lib/docs-search', () => ({
  searchDocumentation: vi.fn(() => []),
  generateSearchIndex: vi.fn(() => Promise.resolve({ pages: [], terms: [] })),
  trackSearchQuery: vi.fn(),
}));

describe('Mobile Integration Tests', () => {
  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders responsive docs layout without errors', () => {
    render(
      <ResponsiveDocsLayout>
        <div>Test content</div>
      </ResponsiveDocsLayout>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('GreekDash')).toBeInTheDocument();
  });

  it('renders progressive image with proper attributes', () => {
    const { container } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
      />
    );

    // Should render loading placeholder initially (SVG icon)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    
    // Should have proper container styling
    const imageContainer = container.firstChild as HTMLElement;
    expect(imageContainer).toHaveStyle({ width: '400px', height: '300px' });
  });

  it('applies mobile-specific CSS classes', () => {
    const { container } = render(
      <div className="touch-manipulation scrollbar-hide">
        Mobile optimized content
      </div>
    );

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('touch-manipulation');
    expect(element).toHaveClass('scrollbar-hide');
  });
});