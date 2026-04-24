import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  telegramId?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  username?: string;
  photoUrl?: string;
  photo_url?: string;
  name?: string;
  email?: string;
}

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;

  // App Data
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  
  cart: any[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  favorites: any[];
  toggleFavorite: (product: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial Auth State (Secure)
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      // Addresses
      addresses: [],
      addAddress: (address) =>
        set((state) => {
          const newAddr = { ...address, id: Math.random().toString(36).substr(2, 9) };
          let newAddresses = [...state.addresses, newAddr];
          if (newAddr.isDefault) {
            newAddresses = newAddresses.map((a) =>
              a.id === newAddr.id ? a : { ...a, isDefault: false }
            );
          }
          return { addresses: newAddresses };
        }),
      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),
      setDefaultAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }
          ),
        })),

      // Cart
      cart: [],
      addToCart: (product, quantity = 1) => set((state) => {
        const existing = state.cart.find((i) => i.product.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          };
        }
        return { cart: [...state.cart, { product, quantity }] };
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((i) => i.product.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        cart: state.cart.map((i) => i.product.id === id ? { ...i, quantity } : i),
      })),
      clearCart: () => set({ cart: [] }),

      // Favorites
      favorites: [],
      toggleFavorite: (product) => set((state) => {
        const isFav = state.favorites.some((p) => p.id === product.id);
        return {
          favorites: isFav
            ? state.favorites.filter((p) => p.id !== product.id)
            : [...state.favorites, product]
        };
      }),
    }),
    { name: 'nuraskin-app-storage' }
  )
);
