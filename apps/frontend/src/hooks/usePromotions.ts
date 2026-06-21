import { queryKeys } from '@nuraskin/shared-utils';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';
import type { PromotionBannerItem } from '@nuraskin/shared-types';

async function fetchPromotions(): Promise<PromotionBannerItem[]> {
  return api.auth.get('/storefront/promotions/active');
}

export function usePromotions() {
  const region = useAppStore(s => s.regionCode); // KOR | UZB | null

  const { data = [] } = useQuery({
    queryKey: queryKeys.promotions.active(),
    queryFn: fetchPromotions,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Filter by region: show if regionCode is null, ALL,
  // or matches current region
  const filtered = data.filter(
    p => !p.regionCode || p.regionCode === 'ALL' || p.regionCode === region
  );

  return { promotions: filtered, region };
}
