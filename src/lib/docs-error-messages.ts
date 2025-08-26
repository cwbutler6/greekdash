import { AlertTriangle, Search, Video, Navigation, FileX, Wifi, RefreshCw } from 'lucide-react';

export interface ErrorMessage {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly suggestions: readonly ErrorSuggestion[];
  readonly severity: 'low' | 'medium' | 'high';
}

export interface ErrorSuggestion {
  readonly title: string;
  readonly description: string;
  readonly action: 'retry' | 'navigate' | 'external' | 'search';
  readonly actionData?: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

// Error message templates for different scenarios
export const ERROR_MESSAGES = {
  // Content errors
  CONTENT_NOT_FOUND: {
    title: 'Page Not Found',
    description: 'The documentation page you\'re looking for doesn\'t exist or has been moved.',
    icon: FileX,
    severity: 'medium' as const,
    suggestions: [
      {
        title: 'Search Documentation',
        description: 'Find what you\'re looking for using our search function',
        action: 'search' as const,
        icon: Search
      },
      {
        title: 'Browse Documentation',
        description: 'Start from the documentation homepage',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      },
      {
        title: 'Getting Started Guide',
        description: 'New to GreekDash? Start with our setup guide',
        action: 'navigate' as const,
        actionData: '/docs/getting-started',
        icon: Navigation
      }
    ]
  },

  CONTENT_LOAD_ERROR: {
    title: 'Content Loading Error',
    description: 'We encountered an error while loading this documentation page.',
    icon: AlertTriangle,
    severity: 'high' as const,
    suggestions: [
      {
        title: 'Retry Loading',
        description: 'Try refreshing the page to reload the content',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Check Connection',
        description: 'Ensure you have a stable internet connection',
        action: 'external' as const,
        actionData: 'check-connection',
        icon: Wifi
      },
      {
        title: 'Browse Other Pages',
        description: 'Navigate to other documentation sections',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      }
    ]
  },

  // Search errors
  SEARCH_UNAVAILABLE: {
    title: 'Search Unavailable',
    description: 'We\'re having trouble with the search function right now.',
    icon: Search,
    severity: 'medium' as const,
    suggestions: [
      {
        title: 'Retry Search',
        description: 'Try searching again in a moment',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Browse Manually',
        description: 'Navigate through documentation sections',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      },
      {
        title: 'Popular Topics',
        description: 'Check out commonly searched topics',
        action: 'navigate' as const,
        actionData: '/docs/admin-guide',
        icon: Search
      }
    ]
  },

  SEARCH_NO_RESULTS: {
    title: 'No Results Found',
    description: 'We couldn\'t find any documentation matching your search.',
    icon: Search,
    severity: 'low' as const,
    suggestions: [
      {
        title: 'Try Different Terms',
        description: 'Use different keywords or check spelling',
        action: 'search' as const,
        icon: Search
      },
      {
        title: 'Browse Categories',
        description: 'Look through documentation sections manually',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      },
      {
        title: 'Popular Pages',
        description: 'Check out frequently visited documentation',
        action: 'navigate' as const,
        actionData: '/docs/admin-guide/members',
        icon: Navigation
      }
    ]
  },

  // Video errors
  VIDEO_LOAD_ERROR: {
    title: 'Video Unavailable',
    description: 'Unable to load video content. This might be due to network issues or video service problems.',
    icon: Video,
    severity: 'medium' as const,
    suggestions: [
      {
        title: 'Retry Loading',
        description: 'Try refreshing the page to reload the video',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Watch on YouTube',
        description: 'View this video directly on YouTube',
        action: 'external' as const,
        actionData: 'youtube',
        icon: Video
      },
      {
        title: 'Read Text Guide',
        description: 'Follow written instructions instead',
        action: 'navigate' as const,
        actionData: '/docs/admin-guide',
        icon: Navigation
      }
    ]
  },

  // Navigation errors
  NAVIGATION_ERROR: {
    title: 'Navigation Error',
    description: 'The navigation menu failed to load properly.',
    icon: Navigation,
    severity: 'high' as const,
    suggestions: [
      {
        title: 'Reload Page',
        description: 'Refresh the page to restore navigation',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Documentation Home',
        description: 'Go to the main documentation page',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      },
      {
        title: 'Direct Links',
        description: 'Use direct links to access sections',
        action: 'navigate' as const,
        actionData: '/docs/admin-guide',
        icon: Navigation
      }
    ]
  },

  SIDEBAR_ERROR: {
    title: 'Sidebar Navigation Error',
    description: 'The documentation sidebar failed to load.',
    icon: Navigation,
    severity: 'medium' as const,
    suggestions: [
      {
        title: 'Reload Page',
        description: 'Refresh to restore the sidebar navigation',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Use Breadcrumbs',
        description: 'Navigate using the breadcrumb trail',
        action: 'external' as const,
        actionData: 'breadcrumbs',
        icon: Navigation
      },
      {
        title: 'Main Sections',
        description: 'Access documentation sections directly',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      }
    ]
  },

  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    description: 'Unable to connect to our servers. Please check your internet connection.',
    icon: Wifi,
    severity: 'high' as const,
    suggestions: [
      {
        title: 'Check Connection',
        description: 'Verify your internet connection is working',
        action: 'external' as const,
        actionData: 'check-connection',
        icon: Wifi
      },
      {
        title: 'Retry in a Moment',
        description: 'Wait a moment and try again',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Cached Content',
        description: 'Try accessing recently viewed pages',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      }
    ]
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    description: 'We encountered an unexpected error. Our team has been notified.',
    icon: AlertTriangle,
    severity: 'high' as const,
    suggestions: [
      {
        title: 'Try Again',
        description: 'Refresh the page and try again',
        action: 'retry' as const,
        icon: RefreshCw
      },
      {
        title: 'Documentation Home',
        description: 'Return to the main documentation page',
        action: 'navigate' as const,
        actionData: '/docs',
        icon: Navigation
      },
      {
        title: 'Contact Support',
        description: 'Get help if the problem persists',
        action: 'external' as const,
        actionData: 'support',
        icon: AlertTriangle
      }
    ]
  }
} as const;

// Helper function to get error message based on error type
export function getErrorMessage(error: Error, context?: string): ErrorMessage {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Network-related errors
  if (errorName.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Context-specific errors
  if (context) {
    switch (context) {
      case 'search':
        if (errorMessage.includes('no results') || errorMessage.includes('not found')) {
          return ERROR_MESSAGES.SEARCH_NO_RESULTS;
        }
        return ERROR_MESSAGES.SEARCH_UNAVAILABLE;
      
      case 'video':
        return ERROR_MESSAGES.VIDEO_LOAD_ERROR;
      
      case 'navigation':
      case 'sidebar':
        return context === 'sidebar' 
          ? ERROR_MESSAGES.SIDEBAR_ERROR 
          : ERROR_MESSAGES.NAVIGATION_ERROR;
      
      case 'content':
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          return ERROR_MESSAGES.CONTENT_NOT_FOUND;
        }
        return ERROR_MESSAGES.CONTENT_LOAD_ERROR;
    }
  }

  // Content-specific errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return ERROR_MESSAGES.CONTENT_NOT_FOUND;
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Helper function to get contextual suggestions based on current page
export function getContextualSuggestions(pathname: string): ErrorSuggestion[] {
  const baseSuggestions: ErrorSuggestion[] = [
    {
      title: 'Documentation Home',
      description: 'Return to the main documentation page',
      action: 'navigate',
      actionData: '/docs',
      icon: Navigation
    }
  ];

  // Add context-specific suggestions based on current path
  if (pathname.includes('/admin-guide')) {
    baseSuggestions.unshift({
      title: 'Admin Guide Home',
      description: 'Go back to the admin guide overview',
      action: 'navigate',
      actionData: '/docs/admin-guide',
      icon: Navigation
    });
  }

  if (pathname.includes('/getting-started')) {
    baseSuggestions.unshift({
      title: 'Getting Started',
      description: 'Return to the getting started guide',
      action: 'navigate',
      actionData: '/docs/getting-started',
      icon: Navigation
    });
  }

  if (pathname.includes('/members')) {
    baseSuggestions.unshift({
      title: 'Member Management',
      description: 'Go to member management documentation',
      action: 'navigate',
      actionData: '/docs/admin-guide/members',
      icon: Navigation
    });
  }

  if (pathname.includes('/finance')) {
    baseSuggestions.unshift({
      title: 'Financial Management',
      description: 'Go to financial management documentation',
      action: 'navigate',
      actionData: '/docs/admin-guide/finance',
      icon: Navigation
    });
  }

  return baseSuggestions;
}