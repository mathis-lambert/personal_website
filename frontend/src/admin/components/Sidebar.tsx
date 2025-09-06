import React from 'react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BriefcaseBusiness,
  GraduationCap,
  IdCard,
  LogOut,
  DoorOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const items: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  {
    label: 'Projects',
    path: '/admin/projects',
    icon: <FolderKanban size={18} />,
  },
  { label: 'Articles', path: '/admin/articles', icon: <FileText size={18} /> },
  {
    label: 'Experiences',
    path: '/admin/experiences',
    icon: <BriefcaseBusiness size={18} />,
  },
  {
    label: 'Studies',
    path: '/admin/studies',
    icon: <GraduationCap size={18} />,
  },
  { label: 'Resume', path: '/admin/resume', icon: <IdCard size={18} /> },
];

const Sidebar: React.FC<{
  currentPath: string;
  onNavigate: (to: string) => void;
}> = ({ currentPath, onNavigate }) => {
  const { logout } = useAdminAuth();

  return (
    <aside className="w-64 h-full border-r bg-card text-card-foreground flex flex-col overflow-y-auto">
      <div className="px-4 py-4 border-b">
        <div className="text-xl font-semibold">Admin</div>
        <div className="text-sm text-muted-foreground">mathislambert.fr</div>
      </div>
      <nav className="flex-1 py-2">
        {items.map((it) => (
          <button
            key={it.path}
            onClick={() => onNavigate(it.path)}
            className={cn(
              'w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-muted transition-colors',
              currentPath === it.path ||
                (it.path === '/admin' && currentPath === '/admin/')
                ? 'bg-muted font-medium'
                : 'font-normal',
            )}
          >
            {it.icon}
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t flex flex-col justify-between gap-2">
        <Link
          className="w-full inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          to="/"
        >
          <DoorOpen size={16} /> Back to site
        </Link>
        <button
          onClick={logout}
          className="w-full inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-red-500/30 hover:bg-red-500"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
