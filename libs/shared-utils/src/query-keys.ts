export const queryKeys = {
  orders: {
    all: () => ['orders'] as const,
    list: (p: object) => ['orders', 'list', p] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  products: {
    all: () => ['products'] as const,
    list: (p: object) => ['products', 'list', p] as const,
    detail: (id: string) => ['products', id] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    detail: (id: string) => ['categories', id] as const,
  },
  coupons: {
    all: () => ['coupons'] as const,
    detail: (id: string) => ['coupons', id] as const,
  },
  customers: {
    all: () => ['customers'] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  settings: {
    all: () => ['settings'] as const,
    public: () => ['storefront-settings'] as const,
  },
  exchangeRates: {
    all: () => ['exchange-rates'] as const,
    latest: () => ['exchange-rates', 'latest'] as const,
  },
  promotions: {
    active: () => ['promotions'] as const,
  },
  shippingTiers: {
    all: () => ['shipping-tiers'] as const,
  },
  team: {
    all: () => ['team'] as const,
  },
  dashboard: {
    all: () => ['dashboard'] as const,
    revenue: (p: object) => ['dashboard', 'revenue', p] as const,
  },
  inventory: {
    all: () => ['inventory'] as const,
  },
} as const;
