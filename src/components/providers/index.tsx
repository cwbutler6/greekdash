"use client";

import { PropsWithChildren } from "react";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackProvider } from "./feedback-provider";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export default function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackProvider>
        {children}
        <Toaster />
        <Analytics />
      </FeedbackProvider>
    </QueryClientProvider>
  );
}