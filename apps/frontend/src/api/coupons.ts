import { apiFetch } from '@/lib/apiFetch';
import type { CouponValidationResponse } from '@nuraskin/shared-types';

export interface StorefrontCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: string; // bigint as string
  valueUzs?: string;
  valueKrw?: string;
  minOrderAmount?: string;
  minOrderUzs?: string;
  minOrderKrw?: string;
  maxRedemptions?: number;
  usageCount: number;
  expiresAt?: string;
  regionCode?: string;
}

export const getAvailableCoupons = () =>
  apiFetch<StorefrontCoupon[]>('/storefront/coupons');

export const validateCoupon = async (input: any) =>
  apiFetch<CouponValidationResponse>('/storefront/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(input),
  });