import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './layouts/Layout';
import Loader from '@/components/ui/Loader.tsx';

const Home = React.lazy(() => import('@/pages/HomePage.tsx'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage.tsx'));

// const About = React.lazy(() => import('@/pages/About.tsx'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* <Route path="/about" element={<About />} /> */}
          </Route>
          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
