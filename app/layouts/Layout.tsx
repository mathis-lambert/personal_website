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
    <div className="min-h-screen relative">
      <AbstractGradientBackground
        numSpheres={8}
        attractionStrength={0.000009}
        minSphereRadius={200}
        maxSphereRadiusFactor={0.5}
        opacityRange={[0.4, 0.6]}
        blurIntensity="blur-[125px]"
      />
      <Navbar />

      <ScrollToTop />

      <main className="mx-auto w-full min-h-screen max-w-5xl pt-20 md:pt-24 lg:pt-28 pb-10 px-4 lg:px-2">
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
