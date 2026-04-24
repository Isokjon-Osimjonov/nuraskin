import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';


export const Route = createFileRoute('/account')({
  component: AccountPage,
});

interface TelegramAuthResult {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function AccountPage() {
  const { user, setAuth, logout } = useAppStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    async function handleTelegramAuth() {
      const params = new URLSearchParams(window.location.search);
      const tgAuthResult = params.get('tgAuthResult');
      if (!tgAuthResult) return;

      try {
        const parsed = JSON.parse(tgAuthResult) as TelegramAuthResult;
        const res = await fetch('http://localhost:4000/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });

        if (res.ok) {
          const { token, user: userData } = await res.json();
          setAuth(token, userData);
          
          // Clear query params and redirect
          const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/account';
          navigate({ to: redirectPath, replace: true });
        } else {
          navigate({ to: '/login' });
        }
      } catch {
        navigate({ to: '/login' });
      }
    }

    if (!user) {
      const params = new URLSearchParams(window.location.search);
      if (params.has('tgAuthResult')) {
        void handleTelegramAuth();
      } else {
        void navigate({ to: '/login' });
      }
    }
  }, [user, setAuth, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    void navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-white">

      <div className="max-w-lg mx-auto mt-12 p-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          <div className="w-16 h-16 rounded-full bg-[#E30B5C]/10 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-[#E30B5C]" />
          </div>

          <h2 className="text-zinc-900 font-semibold text-xl mt-4">{user.first_name}</h2>
          {user.username && (
            <p className="text-zinc-400 text-sm">@{user.username}</p>
          )}

          <div className="border-t border-zinc-100 my-6" />

          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-zinc-900 font-bold text-lg">0</p>
              <p className="text-zinc-400 text-xs mt-1">Buyurtmalar</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-[#E30B5C]">0 UZS</p>
              <p className="text-zinc-400 text-xs mt-1">Qarz</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs">
                Standard
              </span>
              <p className="text-zinc-400 text-xs mt-1">VIP daraja</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 py-2 rounded-lg border border-zinc-200 text-zinc-500 text-sm hover:text-zinc-900 hover:border-zinc-400 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
