export const CUSTOMER_REGIONS = ['KOR', 'UZB'] as const;
export const ALL_REGIONS = ['KOR', 'UZB', 'ALL'] as const;
export type CustomerRegion = 'KOR' | 'UZB';
export type Region = 'KOR' | 'UZB' | 'ALL';

export const REGION_LABELS: Record<CustomerRegion, string> = {
  KOR: '🇰🇷 Koreya',
  UZB: "🇺🇿 O'zbekiston",
};

export const REGION_FLAGS: Record<CustomerRegion, string> = {
  KOR: '🇰🇷',
  UZB: '🇺🇿',
};

export const REGION_PHONE_PREFIX: Record<CustomerRegion, string> = {
  KOR: '+82',
  UZB: '+998',
};

export const REGION_PHONE_PLACEHOLDER: Record<CustomerRegion, string> = {
  KOR: '10 0000 0000',
  UZB: '00 000 00 00',
};

export const REGION_CURRENCY_SYMBOL: Record<CustomerRegion, string> = {
  KOR: '₩',
  UZB: "so'm",
};

export function isCustomerRegion(s: string): s is CustomerRegion {
  return CUSTOMER_REGIONS.includes(s as CustomerRegion);
}
