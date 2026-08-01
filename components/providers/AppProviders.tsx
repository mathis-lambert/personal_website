"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ChatProvider } from "@/components/providers/ChatProvider";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
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
