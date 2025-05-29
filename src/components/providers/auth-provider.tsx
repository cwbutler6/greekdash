"use client";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";
import dynamic from "next/dynamic";

// Dynamically import FeedbackBubble with no SSR to avoid hydration issues
const FeedbackBubble = dynamic(
  () => import("@/components/feedback/feedback-bubble"),
  { ssr: false }
);

// This provider gives all client components access to the Next Auth session
export default function AuthProvider({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      {children}
      <FeedbackBubble />
    </SessionProvider>
  );
}
