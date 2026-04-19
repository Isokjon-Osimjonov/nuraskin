import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: '/login' });
  }

  return (
    <header className="h-14 bg-background border-b border-border shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-foreground font-semibold">NuraSkin Admin</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5" />
      </Button>
    </header>
  );
}
