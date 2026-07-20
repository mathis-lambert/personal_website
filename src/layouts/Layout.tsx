"use client";
import { useState } from "react";
import AbstractGradientBackground from "@/components/ui/AbstractGradientBackground";
import Navbar from "@/components/ui/Navbar";
import ChatPanel from "@/components/chat/ChatPanel";
import FloatingChatInput from "@/components/chat/FloatingChatInput";
import Footer from "@/components/ui/Footer";
import { MaintenanceDialog } from "@/components/ui/MaintenanceDialog";
import ScrollToTop from "@/components/ui/ScrollToTop";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [maintenanceMode] = useState(
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
  );

  return (
    <div className="min-h-screen relative isolate">
      <AbstractGradientBackground
        sphereColors={["#f6bd60", "#50b5a4", "#f28482", "#79a7d3"]}
        numSpheres={4}
        minSphereRadius={130}
        maxSphereRadiusFactor={0.28}
        baseVelocity={0.15}
        opacityRange={[0.16, 0.3]}
        blurIntensity="blur-[90px]"
      />
      <Navbar />

      <ScrollToTop />

      <main className="mx-auto w-full min-h-screen max-w-7xl pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <ChatPanel />
      <FloatingChatInput />
      <Footer />

      {maintenanceMode && <MaintenanceDialog />}

    </div>
  );
};

export default Layout;
