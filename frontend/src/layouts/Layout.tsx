import { Outlet } from 'react-router-dom';
import AbstractGradientBackground from '@/components/abstractGradientBackground/abstractGradientBackground.tsx';
import { useColorMode } from '@/components/ui/color-mode.tsx';
import { useEffect } from 'react';
import MainContainer from '@/components/MainContainer/MainContainer.tsx';

const Layout = () => {
  const { colorMode, setColorMode } = useColorMode();

  // force color mode to light
  useEffect(() => {
    setColorMode('light');
  }, [setColorMode]);

  return (
    <>
      {/* Background universel */}
      <AbstractGradientBackground
        className={`layout-background ${colorMode}`}
      />
      {/* Contenu dynamique selon la route */}
      <MainContainer>
        <Outlet />
      </MainContainer>
    </>
  );
};

export default Layout;
