import { useMutation } from '@tanstack/react-query';
import * as couponsApi from '@/api/coupons';
import type { ValidateCouponInput, CouponValidationResponse } from '@nuraskin/shared-types';

export function useValidateCoupon() {
  return useMutation<CouponValidationResponse, Error, ValidateCouponInput>({
    mutationFn: couponsApi.validateCoupon,
  });
}
