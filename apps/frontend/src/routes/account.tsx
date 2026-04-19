import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/account')({
  component: AccountPage,
});

function AccountPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      void navigate({ to: '/login' });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    void navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="bg-zinc-900 border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <span className="text-white font-semibold text-lg tracking-wide">NuraSkin</span>
        <button
          onClick={handleLogout}
          className="text-zinc-400 text-sm hover:text-white transition-colors flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </nav>

      <div className="max-w-lg mx-auto mt-12 p-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
          <div className="w-16 h-16 rounded-full bg-[#E30B5C]/20 flex items-center justify-center">
            <User className="h-8 w-8 text-[#E30B5C]" />
          </div>

          <h2 className="text-white font-semibold text-xl mt-4">{user.first_name}</h2>
          {user.username && (
            <p className="text-zinc-400 text-sm">@{user.username}</p>
          )}

          <div className="border-t border-zinc-800 my-6" />

          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-white font-bold text-lg">0</p>
              <p className="text-zinc-400 text-xs mt-1">Buyurtmalar</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-[#E30B5C]">0 UZS</p>
              <p className="text-zinc-400 text-xs mt-1">Qarz</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs">
                Standard
              </span>
              <p className="text-zinc-400 text-xs mt-1">VIP daraja</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-white hover:border-zinc-500 transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
