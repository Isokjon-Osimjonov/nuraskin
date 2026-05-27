export const STORAGE_KEYS = {
  ADMIN_AUTH:       'nuraskin-admin-auth',
  APP_STORE:        'nuraskin-app-storage',
  PROMO_DISMISSED:  'nura_promo_dismissed_v1',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE:    1,
  DEFAULT_LIMIT:   10,
  LIMIT_OPTIONS:   [10, 20, 50, 100],
} as const;

export const BRAND = {
  COLOR_PRIMARY:   '#4A1525',
  COLOR_ACCENT:    '#E30B5C',
  NAME:            'NuraSkin',
} as const;
