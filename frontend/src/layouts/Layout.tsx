import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AbstractGradientBackground from '@/components/ui/AbstractGradientBackground';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar.tsx';
import InPageChatInput from '@/components/ui/InPageChatInput.tsx';
import Footer from '@/components/ui/Footer.tsx';

const Layout = () => {
  useEffect(() => {
    // Forcer le mode clair en retirant la classe "dark"
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen relative">
      <AbstractGradientBackground
        numSpheres={8}
        attractionStrength={0.000009}
        minSphereRadius={200}
        maxSphereRadiusFactor={0.5}
        opacityRange={[0.4, 0.6]}
        blurIntensity={'blur-[125px]'}
        // sphereColors={['#3357FF']}
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
    </div>
  );
};

export default Layout;
