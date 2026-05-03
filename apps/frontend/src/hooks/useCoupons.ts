import { useQuery, useMutation } from '@tanstack/react-query';
import { getAvailableCoupons, validateCoupon } from '@/api/coupons';

export function useCoupons() {
  return useQuery({
    queryKey: ['storefront-coupons'],
    queryFn: getAvailableCoupons,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: validateCoupon,
  });
}