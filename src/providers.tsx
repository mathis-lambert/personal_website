"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChatProvider } from "@/providers/ChatProvider";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="next-ui-theme"
      >
        <ChatProvider>
          <PageViewTracker />
          {children}
          <Toaster />
        </ChatProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
