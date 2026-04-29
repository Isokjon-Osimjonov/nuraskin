import { apiFetch } from '@/lib/apiFetch';
import type { 
  ValidateCouponInput, 
  CouponValidationResponse 
} from '@nuraskin/shared-types';

export const validateCoupon = async (input: ValidateCouponInput): Promise<CouponValidationResponse> => {
  return await apiFetch<CouponValidationResponse>('/storefront/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};
