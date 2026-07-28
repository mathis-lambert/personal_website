"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChatProvider } from "@/providers/ChatProvider";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="next-ui-theme"
    >
      <MotionConfig reducedMotion="user">
        <ChatProvider>
          <PageViewTracker />
          {children}
          <Toaster />
        </ChatProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
