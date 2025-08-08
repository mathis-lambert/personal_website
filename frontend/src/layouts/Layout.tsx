import { useState } from 'react';
import AbstractGradientBackground from '@/components/ui/AbstractGradientBackground';
import Navbar from '@/components/ui/Navbar.tsx';
import ChatPanel from '@/components/chat/ChatPanel';
import FloatingChatInput from '@/components/chat/FloatingChatInput';
import Footer from '@/components/ui/Footer.tsx';
import { MaintenanceDialog } from '@/components/ui/MaintenanceDialog.tsx';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import ScrollToTop from '@/components/ui/ScrollToTop.tsx';

const Layout = () => {
  const [maintenanceMode] = useState(
    import.meta.env.VITE_MAINTENANCE_MODE === 'true',
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

      <AnimatedOutlet />

      <ChatPanel />
      <FloatingChatInput />
      <Footer />

      {maintenanceMode && <MaintenanceDialog />}
    </div>
  );
};

export default Layout;
