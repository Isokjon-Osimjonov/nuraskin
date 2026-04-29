import { apiFetch } from '@/lib/apiFetch';
import type { CartResponse, AddToCartInput, UpdateCartItemInput } from '@nuraskin/shared-types';

export const getCart = () => apiFetch<CartResponse>('/storefront/cart');

export const addToCart = (input: AddToCartInput) => 
  apiFetch<CartResponse>('/storefront/cart/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateCartItem = (itemId: string, input: UpdateCartItemInput) =>
  apiFetch<CartResponse>(`/storefront/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const removeCartItem = (itemId: string) =>
  apiFetch<CartResponse>(`/storefront/cart/items/${itemId}`, {
    method: 'DELETE',
  });

export const clearCart = () =>
  apiFetch<void>('/storefront/cart', {
    method: 'DELETE',
  });
