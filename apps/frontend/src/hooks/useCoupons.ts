import { useQuery, useMutation } from '@tanstack/react-query';
import { getAvailableCoupons, validateCoupon } from '@/api/coupons';

import { useAppStore } from '@/stores/app.store';

export function useCoupons() {
  const { regionCode } = useAppStore();
  return useQuery({
    queryKey: ['storefront-coupons', regionCode],
    queryFn: () => getAvailableCoupons(regionCode || undefined),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: validateCoupon,
  });
}
