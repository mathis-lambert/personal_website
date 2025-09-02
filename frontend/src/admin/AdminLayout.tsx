import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/admin/components/Sidebar';

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Sidebar */}
      <Sidebar currentPath={location.pathname} onNavigate={navigate} />

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;

