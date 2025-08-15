'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './error-boundaries/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Log query errors to Sentry
          if (failureCount === 0) {
            Sentry.captureException(error, {
              tags: { component: 'react-query' },
              extra: { failureCount }
            });
          }
          return failureCount < 3;
        },
      },
      mutations: {
        onError: (error) => {
          // Log mutation errors to Sentry
          Sentry.captureException(error, {
            tags: { component: 'react-query-mutation' }
          });
        },
      },
    },
  }));

  return (
    <ErrorBoundary context="providers">
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
