import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Loader from '@/components/ui/Loader.tsx';

const Home = React.lazy(() => import('@/pages/HomePage.tsx'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage.tsx'));
// const About = React.lazy(() => import('@/pages/About.tsx'));

function App() {
  const [maintenanceMode] = useState(
    import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  );

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {maintenanceMode ? (
            <Route path="*" element={<div>Application en maintenance.</div>} />
          ) : (
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              {/* <Route path="/about" element={<About />} /> */}
            </Route>
          )}
          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
