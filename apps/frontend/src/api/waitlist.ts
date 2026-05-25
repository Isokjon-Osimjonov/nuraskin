import { api } from '@/lib/api';
import type { ProductWaitlistResponse } from '@nuraskin/shared-types';

export const getMyWaitlist = () => api.auth.get<ProductWaitlistResponse[]>('/storefront/waitlist');

export const addToWaitlist = (productId: string) =>
  api.auth.post<any>('/storefront/waitlist', { productId });

export const removeFromWaitlist = (productId: string) =>
  api.auth.delete<any>(`/storefront/waitlist/${productId}`);
