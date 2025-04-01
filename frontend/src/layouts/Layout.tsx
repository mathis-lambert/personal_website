import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AbstractGradientBackground from '@/components/ui/AbstractGradientBackground';

const Layout = () => {
  useEffect(() => {
    // Forcer le mode clair en retirant la classe "dark"
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <AbstractGradientBackground className="layout-background light" />
      <div className={'bg-transparent relative'}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
