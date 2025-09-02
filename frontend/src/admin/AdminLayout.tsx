import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/admin/components/Sidebar';
import { Laptop2 } from 'lucide-react';

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSmall, setIsSmall] = React.useState(false);
  React.useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Fixed sidebar */}
      <div className="fixed inset-y-0 left-0 z-40">
        <Sidebar currentPath={location.pathname} onNavigate={navigate} />
      </div>

      {/* Scrollable content area */}
      <main className="ml-64 h-screen overflow-y-auto p-6">
        {children ?? <Outlet />}
      </main>

      {/* Mobile lockout */}
      {isSmall && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center border rounded-xl bg-card text-card-foreground shadow-sm p-6">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Laptop2 className="text-primary" size={24} />
            </div>
            <h2 className="text-lg font-semibold mb-1">Must be used on laptop</h2>
            <p className="text-sm text-muted-foreground">The admin dashboard is optimized for wider screens. Please use a laptop or a larger display.</p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
