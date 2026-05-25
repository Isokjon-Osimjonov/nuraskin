import { api } from '@/lib/api';
import type { CouponValidationResponse } from '@nuraskin/shared-types';

export interface StorefrontCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';
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
  scope: 'ENTIRE_ORDER' | 'PRODUCTS' | 'CATEGORIES' | 'BRANDS';
  isUsed: boolean;
  autoApplied: boolean;
  applicableProductNames: string[];
  applicableCategoryNames: string[];
  applicableBrands: string[];
  isTargeted: boolean;
  isStackable: boolean;
}

export const getAvailableCoupons = () =>
  api.get<StorefrontCoupon[]>('/storefront/coupons');

export const validateCoupon = async (input: any) =>
  api.post<CouponValidationResponse>('/storefront/coupons/validate', input);