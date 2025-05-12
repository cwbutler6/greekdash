"use client";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

// This provider gives all client components access to the Next Auth session
export default function AuthProvider({ children }: PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>;
}
