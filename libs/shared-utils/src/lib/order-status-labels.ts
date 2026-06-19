import { OrderStatus } from '@nuraskin/shared-types';

export const ORDER_STATUS_LABELS_UZ: Record<OrderStatus, string> = {
  DRAFT: 'Qoralama',
  PENDING_PAYMENT: "To'lov kutilmoqda",
  PAYMENT_SUBMITTED: 'Chek yuborildi',
  PAYMENT_CONFIRMED: "To'lov tasdiqlandi",
  PAYMENT_REJECTED: "To'lov rad etildi",
  PACKING: 'Tayyorlanmoqda',
  SHIPPED: "Yo'lda",
  DELIVERED: 'Yetkazilgan',
  CANCELED: 'Bekor qilindi',
  REFUNDED: 'Qaytarildi',
};
