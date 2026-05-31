export const STORAGE_KEYS = {
  ADMIN_AUTH: 'nuraskin-admin-auth',
  APP_STORE: 'nuraskin-app-storage',
  PROMO_DISMISSED: 'nura_promo_dismissed_v1',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
} as const;

export const BRAND = {
  COLOR_PRIMARY: '#4A1525',
  COLOR_ACCENT: '#E30B5C',
  NAME: 'NuraSkin',
} as const;

export const STORE_INFO = {
  NAME: 'NuraSkin',
  ADDRESS: {
    KO: '경북 경산시 임당동 574-11 NURASKIN 1층 가게',
    UZ: 'Koreya, Gyeongsan sh., Imdang-dong 574-11, 1-qavat',
  },
  PHONES: [
    { label: '010-359-89697', href: 'tel:+821035989697' },
    { label: '010-8088-9697', href: 'tel:+821080889697' },
  ],
  SOCIAL: {
    TELEGRAM: {
      name: 'Telegram',
      label: '@Optom_Korea_Kosmetika',
      href: 'https://t.me/Optom_Korea_Kosmetika',
    },
    INSTAGRAM: {
      name: 'Instagram',
      label: '@nura___skin',
      href: 'https://instagram.com/nura___skin',
    },
  },
} as const;
