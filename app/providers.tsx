"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChatProvider } from "@/providers/ChatProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider storageKey="next-ui-theme">
        <ChatProvider>
          {children}
          <Toaster />
        </ChatProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
