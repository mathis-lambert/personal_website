import type { Metadata } from "next";

import { AppProviders } from "@/providers";
import "./globals.css";

const baseUrl = process.env.PUBLIC_BASE_URL || "https://mathislambert.fr";

export const metadata: Metadata = {
  title: "Mathis Lambert | Software & AI Engineer",
  description: "Portfolio, projects, resume, and writings by Mathis Lambert.",
  metadataBase: new URL(baseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
