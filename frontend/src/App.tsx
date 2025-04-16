import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './layouts/Layout';
import Loader from '@/components/ui/Loader.tsx';
import ProjectDetailPage from '@/pages/ProjectDetailPage.tsx';

const Home = React.lazy(() => import('@/pages/HomePage.tsx'));
const Projects = React.lazy(() => import('@/pages/ProjectsPage.tsx'));
const Blog = React.lazy(() => import('@/pages/BlogPage.tsx'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage.tsx'));

// const About = React.lazy(() => import('@/pages/About.tsx'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route
              path="/projects/:projectId"
              element={<ProjectDetailPage />}
            />
            <Route path="/blog" element={<Blog />} />
          </Route>
          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
