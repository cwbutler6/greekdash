import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useRouter } from 'next/navigation';
import { DocsErrorBoundary } from '@/components/docs/error-boundaries/docs-error-boundary';
import { SearchErrorBoundary } from '@/components/docs/error-boundaries/search-error-boundary';
import { VideoErrorBoundary } from '@/components/docs/error-boundaries/video-error-boundary';
import { NavigationErrorBoundary } from '@/components/docs/error-boundaries/navigation-error-boundary';
import { MissingContentFallback } from '@/components/docs/fallbacks/missing-content-fallback';
import { SearchFailureFallback } from '@/components/docs/fallbacks/search-failure-fallback';
import { ComprehensiveErrorHandler } from '@/components/docs/error-handlers/comprehensive-error-handler';
import { getErrorMessage } from '@/lib/docs-error-messages';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/docs/admin-guide/members'),
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((callback) => callback({
    setTag: vi.fn(),
    setContext: vi.fn(),
    captureException: vi.fn(),
  })),
  addBreadcrumb: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown).mockReturnValue(mockRouter);
  vi.clearAllMocks();
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('Documentation Error Boundaries', () => {
  describe('DocsErrorBoundary', () => {
    it('should catch and display documentation errors', () => {
      render(
        <DocsErrorBoundary pageSlug="test-page" section="admin-guide">
          <ThrowError />
        </DocsErrorBoundary>
      );

      expect(screen.getByText('Documentation Error')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an error while loading this documentation page/)).toBeInTheDocument();
      expect(screen.getByText('test-page')).toBeInTheDocument();
      expect(screen.getByText('admin-guide')).toBeInTheDocument();
    });

    it('should provide recovery actions', () => {
      render(
        <DocsErrorBoundary>
          <ThrowError />
        </DocsErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      expect(screen.getByText('Search Documentation')).toBeInTheDocument();
      expect(screen.getByText('Documentation Home')).toBeInTheDocument();
    });

    it('should navigate to suggested pages', () => {
      render(
        <DocsErrorBoundary>
          <ThrowError />
        </DocsErrorBoundary>
      );

      fireEvent.click(screen.getByText('Documentation Home'));
      expect(mockRouter.push).toHaveBeenCalledWith('/docs');
    });
  });

  describe('SearchErrorBoundary', () => {
    it('should display search-specific error messages', () => {
      render(
        <SearchErrorBoundary query="test query">
          <ThrowError />
        </SearchErrorBoundary>
      );

      expect(screen.getByText('Search Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/We're having trouble with the search function/)).toBeInTheDocument();
      expect(screen.getByText('"test query"')).toBeInTheDocument();
    });

    it('should show popular pages when search fails', () => {
      render(
        <SearchErrorBoundary>
          <ThrowError />
        </SearchErrorBoundary>
      );

      expect(screen.getByText('Popular Documentation Pages')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });
  });

  describe('VideoErrorBoundary', () => {
    it('should display video-specific error messages', () => {
      render(
        <VideoErrorBoundary videoId="test123" videoTitle="Test Video">
          <ThrowError />
        </VideoErrorBoundary>
      );

      expect(screen.getByText(/Unable to load video content/)).toBeInTheDocument();
      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('test123')).toBeInTheDocument();
    });

    it('should provide video alternatives', () => {
      render(
        <VideoErrorBoundary videoId="test123" showAlternatives={true}>
          <ThrowError />
        </VideoErrorBoundary>
      );

      expect(screen.getByText('Alternative Resources')).toBeInTheDocument();
      expect(screen.getByText('Step-by-Step Guide')).toBeInTheDocument();
      expect(screen.getByText('Watch on YouTube')).toBeInTheDocument();
    });
  });

  describe('NavigationErrorBoundary', () => {
    it('should display navigation-specific errors', () => {
      render(
        <NavigationErrorBoundary navigationContext="sidebar">
          <ThrowError />
        </NavigationErrorBoundary>
      );

      expect(screen.getByText('Sidebar Navigation Error')).toBeInTheDocument();
      expect(screen.getByText(/The documentation sidebar failed to load/)).toBeInTheDocument();
    });

    it('should provide fallback navigation', () => {
      render(
        <NavigationErrorBoundary>
          <ThrowError />
        </NavigationErrorBoundary>
      );

      expect(screen.getByText('Quick Navigation')).toBeInTheDocument();
      expect(screen.getByText('Documentation Home')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });
});

describe('Fallback Components', () => {
  describe('MissingContentFallback', () => {
    it('should display missing content message', () => {
      render(
        <MissingContentFallback 
          pageSlug="missing-page" 
          section="admin-guide"
          title="Missing Page"
        />
      );

      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The documentation page "Missing Page" could not be found/)).toBeInTheDocument();
      expect(screen.getByText('missing-page')).toBeInTheDocument();
    });

    it('should show suggested pages', () => {
      render(<MissingContentFallback />);

      expect(screen.getByText('Popular Documentation Pages')).toBeInTheDocument();
      expect(screen.getByText('Getting Started Guide')).toBeInTheDocument();
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });

    it('should handle back navigation', () => {
      // Mock window.history
      Object.defineProperty(window, 'history', {
        value: { length: 2 },
        writable: true
      });

      render(<MissingContentFallback showBackButton={true} />);

      fireEvent.click(screen.getByText('Go Back'));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('SearchFailureFallback', () => {
    it('should display search failure message', () => {
      render(
        <SearchFailureFallback 
          query="failed query"
          errorMessage="Custom error message"
        />
      );

      expect(screen.getByText('Search Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.getByText('"failed query"')).toBeInTheDocument();
    });

    it('should allow new search attempts', async () => {
      render(<SearchFailureFallback />);

      const searchInput = screen.getByPlaceholderText('Search documentation...');
      const searchButton = screen.getByText('Search Again');

      fireEvent.change(searchInput, { target: { value: 'new search' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/docs/search?q=new%20search');
      });
    });

    it('should handle popular search clicks', () => {
      render(<SearchFailureFallback />);

      const popularSearch = screen.getByText('invite members');
      fireEvent.click(popularSearch);

      expect(mockRouter.push).toHaveBeenCalledWith('/docs/search?q=invite%20members');
    });
  });
});

describe('ComprehensiveErrorHandler', () => {
  const testError = new Error('Test error message');

  it('should display error information correctly', () => {
    render(
      <ComprehensiveErrorHandler 
        error={testError}
        context="content"
        showDetails={true}
      />
    );

    expect(screen.getByText('Content Loading Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an error while loading/)).toBeInTheDocument();
  });

  it('should show error details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ComprehensiveErrorHandler 
        error={testError}
        showDetails={true}
      />
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle suggestion actions', () => {
    render(
      <ComprehensiveErrorHandler 
        error={testError}
        context="content"
      />
    );

    // Find and click a navigation suggestion
    const docHomeButton = screen.getByText('Documentation Home');
    fireEvent.click(docHomeButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/docs');
  });

  it('should call custom retry handler', () => {
    const mockRetry = vi.fn();
    
    render(
      <ComprehensiveErrorHandler 
        error={testError}
        onRetry={mockRetry}
      />
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });
});

describe('Error Message System', () => {
  it('should return appropriate error messages for different contexts', () => {
    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';

    const message = getErrorMessage(networkError);
    expect(message.title).toBe('Connection Problem');
    expect(message.severity).toBe('high');
  });

  it('should handle search context errors', () => {
    const searchError = new Error('Search service unavailable');
    const message = getErrorMessage(searchError, 'search');
    
    expect(message.title).toBe('Search Unavailable');
    expect(message.suggestions).toContainEqual(
      expect.objectContaining({
        title: 'Retry Search',
        action: 'retry'
      })
    );
  });

  it('should handle video context errors', () => {
    const videoError = new Error('Video failed to load');
    const message = getErrorMessage(videoError, 'video');
    
    expect(message.title).toBe('Video Unavailable');
    expect(message.suggestions).toContainEqual(
      expect.objectContaining({
        title: 'Watch on YouTube',
        action: 'external'
      })
    );
  });

  it('should provide fallback for unknown errors', () => {
    const unknownError = new Error('Unknown error');
    const message = getErrorMessage(unknownError);
    
    expect(message.title).toBe('Something Went Wrong');
    expect(message.severity).toBe('high');
  });
});