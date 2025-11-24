import Script from "next/script";
import type { Metadata } from "next";

import { AppProviders } from "@/providers";
import "./globals.css";

const baseUrl =
  process.env.PUBLIC_BASE_URL || "https://mathislambert.fr";

const themeInitializer = `
(() => {
  try {
    const storageKey = 'next-ui-theme';
    const stored = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'light';
    const selected =
      stored === 'light' || stored === 'dark'
        ? stored
        : stored === 'system'
          ? systemTheme
          : systemTheme;

    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('light', 'dark');
    body?.classList?.remove('light', 'dark');

    root.classList.add(selected);
    body?.classList?.add(selected);
    root.style.colorScheme = selected;
  } catch {
    /* no-op */
  }
})();
`;

export const metadata: Metadata = {
  title: "Mathis Lambert | Software & AI Engineer",
  description:
    "Portfolio, projects, resume, and writings by Mathis Lambert.",
  metadataBase: new URL(baseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializer }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
