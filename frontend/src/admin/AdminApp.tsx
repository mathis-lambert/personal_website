import React, { Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import AdminLayout from '@/admin/AdminLayout';
import Loader from '@/components/ui/Loader';

const LoginPage = React.lazy(() => import('@/admin/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/admin/pages/DashboardPage'));
const ProjectsPage = React.lazy(() => import('@/admin/pages/ProjectsPage'));
const ArticlesPage = React.lazy(() => import('@/admin/pages/ArticlesPage'));
const ExperiencesPage = React.lazy(() => import('@/admin/pages/ExperiencesPage'));
const StudiesPage = React.lazy(() => import('@/admin/pages/StudiesPage'));
const ResumePage = React.lazy(() => import('@/admin/pages/ResumePage'));

// Middleware to protect admin routes
const RequireAdminAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const AdminRoot: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAdminAuth>
                <AdminLayout>
                  <Suspense fallback={<Loader />}>
                    <Outlet />
                  </Suspense>
                </AdminLayout>
              </RequireAdminAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="experiences" element={<ExperiencesPage />} />
            <Route path="studies" element={<StudiesPage />} />
            <Route path="resume" element={<ResumePage />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
};

export default AdminRoot;

