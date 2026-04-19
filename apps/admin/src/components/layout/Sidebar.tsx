import { Link, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import type { LucideIcon } from 'lucide-react';

type AppPath = '/' | '/products' | '/orders' | '/login';

interface NavLink {
  label: string;
  to: AppPath;
  icon: LucideIcon;
}

const navLinks: NavLink[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Orders', to: '/orders', icon: ShoppingCart },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: '/login' });
  }

  return (
    <aside className="w-64 bg-zinc-900 h-screen fixed left-0 top-0 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-white font-semibold text-lg">NuraSkin</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navLinks.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 text-zinc-400 hover:text-white hover:bg-zinc-800"
            activeProps={{
              className:
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 bg-zinc-800 text-white',
            }}
            activeOptions={{ exact: to === '/' }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800 mt-4"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        Logout
      </Button>
    </aside>
  );
}
