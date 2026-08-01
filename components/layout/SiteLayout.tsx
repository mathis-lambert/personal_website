import type { ReactNode } from "react";

import ChatPanel from "@/components/chat/ChatPanel";
import { AmbientField } from "@/components/ds";
import FloatingChatInput from "@/components/chat/FloatingChatInput";
import Footer from "@/components/layout/Footer";
import { MaintenanceDialog } from "@/components/layout/MaintenanceDialog";
import Navbar from "@/components/layout/Navbar";
import ScrollToTop from "@/components/layout/ScrollToTop";

const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

const SiteLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-1 flex-col">
    {/* Drifting colour under the page, paper texture over it. Both purely
        decorative and never interactive. */}
    <AmbientField />
    <div className="grain" aria-hidden="true" />

    <a
      href="#main"
      className="sr-only rounded-full bg-ink px-4 py-2 text-sm font-bold text-ink-invert focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[600]"
    >
      Skip to content
    </a>

    <ScrollToTop />
    <Navbar />

    {/* The composer is fixed to the bottom of the viewport, so the page needs
        room to scroll clear of it or its last line is permanently covered. */}
    <main id="main" className="flex-1 pb-20">
      {children}
    </main>

    <Footer />

    <ChatPanel />
    <FloatingChatInput />

    {maintenanceMode ? <MaintenanceDialog /> : null}
  </div>
);

export default SiteLayout;
