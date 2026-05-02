import { useEffect, useRef, useCallback, useState } from 'react';
import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { updateRegion } from '@/api/profile';
import { apiFetch } from '@/lib/apiFetch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: ({ context }) => {
    // Note: context usually comes from the router, but we can check store directly here if needed
    // However, beforeLoad runs before component, so we use store state
    const token = useAppStore.getState().token;
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectUrl } = Route.useSearch();
  const setAuth = useAppStore((s) => s.setAuth);
  const setRegion = useAppStore((s) => s.setRegion);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [pendingProfileRegion, setPendingProfileRegion] = useState<string>('');
  const [showRegionConflict, setShowRegionConflict] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState('/');

  const clearCartMutation = useMutation({
    mutationFn: () => apiFetch('/storefront/cart', { method: 'DELETE' })
  });
  const clearCart = () => clearCartMutation.mutateAsync();

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'nuraskin_manager_bot';

  const handleAuth = useCallback(async (user: any) => {
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (res.ok) {
        const { token, user: userData } = await res.json();
        setAuth(token, userData);

        const guestRegion = useAppStore.getState().regionCode;
        const profileRegion = userData.regionCode || userData.region;
        const cartData = queryClient.getQueryData(['cart']);
        const hasCartItems = (cartData as any)?.items?.length > 0;

        if (guestRegion === profileRegion || !profileRegion) {
          navigate({ to: redirectUrl || '/', replace: true });
          return;
        }

        if (!hasCartItems) {
          setRegion(profileRegion);
          await updateRegion(profileRegion);
          navigate({ to: redirectUrl || '/', replace: true });
          return;
        }

        setPendingProfileRegion(profileRegion);
        setPendingRedirect(redirectUrl || '/');
        setShowRegionConflict(true);

      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Server connection error.');
    }
  }, [setAuth, navigate, redirectUrl, queryClient, setRegion]);

  const handleKeepGuestRegion = async () => {
    const guestRegion = useAppStore.getState().regionCode;
    if (guestRegion) {
      await updateRegion(guestRegion);
    }
    setShowRegionConflict(false);
    navigate({ to: pendingRedirect, replace: true });
  };

  const handleUseProfileRegion = async () => {
    setRegion(pendingProfileRegion as 'UZB' | 'KOR');
    await clearCart();
    queryClient.setQueryData(['cart'], null);
    queryClient.invalidateQueries({ 
      queryKey: ['products', pendingProfileRegion] 
    });
    setShowRegionConflict(false);
    navigate({ to: pendingRedirect, replace: true });
  };

  useEffect(() => {
    // Set global callback for Telegram
    window.onTelegramAuth = (user) => handleAuth(user);

    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetRef.current.appendChild(script);
    }

    return () => {
      // @ts-ignore
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleAuth]);

  const guestRegion = useAppStore.getState().regionCode;

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)' }}
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-sm w-full">
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold tracking-tight">NuraSkin</h1>
            <p className="text-white/60 text-sm mt-1">Hisobingizga kiring</p>
          </div>

          <div className="border-t border-white/10 my-8" />

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center min-h-[44px]" ref={widgetRef} />

          <p className="text-white/30 text-[11px] text-center mt-6 leading-relaxed">
            Xavfsiz kirish uchun Telegram akkauntingizdan foydalaniladi
          </p>

          <div className="text-center mt-10">
            <Link
              to="/"
              className="text-white/40 text-xs hover:text-white/70 transition-colors"
            >
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>

      <Dialog 
        open={showRegionConflict}
        onOpenChange={() => {}} 
      >
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Mintaqani tanlang</DialogTitle>
            <DialogDescription>
              Siz {guestRegion === 'UZB' ? "O'zbekiston" : 'Koreya'} mintaqasida ko'rmoqda edingiz, lekin profilingiz{' '}
              {pendingProfileRegion === 'UZB' ? "O'zbekiston" : 'Koreya'} mintaqasida.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleKeepGuestRegion}
            >
              {guestRegion === 'UZB' ? "O'zbekiston" : 'Koreya'}da davom eting
            </Button>
            <Button 
              className="flex-1 bg-[#E8472A] hover:bg-[#d63d22] text-white"
              onClick={handleUseProfileRegion}
            >
              {pendingProfileRegion === 'UZB' ? "O'zbekiston" : 'Koreya'}ga o'ting
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {pendingProfileRegion} mintaqasiga o'tish savatingizni tozalaydi.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
