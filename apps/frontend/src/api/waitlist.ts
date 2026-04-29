import { apiFetch } from '@/lib/apiFetch';
import type { ProductWaitlistResponse } from '@nuraskin/shared-types';

export const getMyWaitlist = () => apiFetch<ProductWaitlistResponse[]>('/storefront/waitlist');

export const addToWaitlist = (productId: string) =>
  apiFetch<void>('/storefront/waitlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });

export const removeFromWaitlist = (productId: string) =>
  apiFetch<void>(`/storefront/waitlist/${productId}`, {
    method: 'DELETE',
  });
