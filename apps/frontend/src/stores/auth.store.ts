import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

interface AuthState {
  user: TelegramUser | null;
  setUser: (user: TelegramUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'nuraskin-frontend-auth' }
  )
);
