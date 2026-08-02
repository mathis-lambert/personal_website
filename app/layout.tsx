import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/AppProviders";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathis Lambert | Software & AI Engineer",
  description: "Portfolio, projects, resume, and writings by Mathis Lambert.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Mathis Lambert | Software & AI Engineer",
    description: "Practical AI, thoughtful systems, and the stories behind them.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
