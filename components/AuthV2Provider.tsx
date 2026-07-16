"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function AuthV2Provider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
