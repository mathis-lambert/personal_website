import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AbstractGradientBackground from '@/components/ui/AbstractGradientBackground';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar.tsx';
import InPageChatInput from '@/components/ui/InPageChatInput.tsx';
import Footer from '@/components/ui/Footer.tsx';
import { MaintenanceDialog } from '@/components/ui/MaintenanceDialog.tsx';

const Layout = () => {
  const [maintenanceMode] = useState(
    import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  );

  return (
    <div className="min-h-screen relative">
      <AbstractGradientBackground
        numSpheres={8}
        attractionStrength={0.000009}
        minSphereRadius={200}
        maxSphereRadiusFactor={0.5}
        opacityRange={[0.4, 0.6]}
        blurIntensity={'blur-[125px]'}
      />
      <Navbar />
      <motion.div
        className={'relative w-full p-4'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className={'w-full max-w-[1000px] mx-auto'}>
          <Outlet />
        </div>
      </motion.div>

      <InPageChatInput />

      <Footer />

      {maintenanceMode && (
        <MaintenanceDialog />
      )}
    </div>
  );
};

export default Layout;
