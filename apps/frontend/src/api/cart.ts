import { api } from '@/lib/api';
import type { CartResponse, AddToCartInput, UpdateCartItemInput } from '@nuraskin/shared-types';
import { useAppStore } from '@/stores/app.store';

export const getCart = () => api.auth.get<CartResponse>('/storefront/cart');

export const addToCart = (input: AddToCartInput) => {
  const regionCode = useAppStore.getState().regionCode;
  return api.auth.post<any>('/storefront/cart/items', { ...input, regionCode });
};

export const updateCartItem = (itemId: string, input: UpdateCartItemInput) =>
  api.auth.patch<any>(`/storefront/cart/items/${itemId}`, input);

export const removeCartItem = (itemId: string) =>
  api.auth.delete<any>(`/storefront/cart/items/${itemId}`);

export const clearCart = (regionCode?: string) =>
  api.auth.delete<any>('/storefront/cart' + (regionCode ? `?regionCode=${regionCode}` : ''));
