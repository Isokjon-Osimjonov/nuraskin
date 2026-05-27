export const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_REJECTED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
  'REFUNDED',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAID_STATUSES: OrderStatus[] = [
  'PAYMENT_CONFIRMED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT:             'Qoralama',
  PENDING_PAYMENT:   "To'lov kutilmoqda",
  PAYMENT_SUBMITTED: "To'lov yuborildi",
  PAYMENT_CONFIRMED: "To'lov tasdiqlandi",
  PAYMENT_REJECTED:  "To'lov rad etildi",
  PACKING:           'Qadoqlanmoqda',
  SHIPPED:           "Yo'lda",
  DELIVERED:         'Yetkazildi',
  CANCELED:          'Bekor qilindi',
  REFUNDED:          'Qaytarildi',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT:             'text-gray-600 bg-gray-50 border-gray-200',
  PENDING_PAYMENT:   'text-yellow-600 bg-yellow-50 border-yellow-200',
  PAYMENT_SUBMITTED: 'text-blue-600 bg-blue-50 border-blue-200',
  PAYMENT_CONFIRMED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  PAYMENT_REJECTED:  'text-red-600 bg-red-50 border-red-200',
  PACKING:           'text-orange-600 bg-orange-50 border-orange-200',
  SHIPPED:           'text-purple-600 bg-purple-50 border-purple-200',
  DELIVERED:         'text-green-600 bg-green-50 border-green-200',
  CANCELED:          'text-red-600 bg-red-50 border-red-200',
  REFUNDED:          'text-pink-600 bg-pink-50 border-pink-200',
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}
