import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import ChatPage from './pages/ChatPage';
import MainPage from '@/pages/MainPage.tsx';
import { useEffect, useState } from 'react';
import Loader from '@/components/Loader/Loader.tsx';

function App() {
  const [maintenanceMode] = useState(import.meta.env.VITE_MAINTENANCE_MODE);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un délai de chargement (remplace par une vraie vérification si besoin)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {maintenanceMode && (
          <Route path="*" element={<Layout />}>
            <Route index element={<ChatPage />} />
          </Route>
        )}
        {!maintenanceMode && (
          <Route path="/" element={<Layout />}>
            <Route index element={<MainPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
