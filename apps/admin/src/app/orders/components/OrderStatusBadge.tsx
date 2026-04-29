import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { type OrderStatus } from '@nuraskin/shared-types';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Qoralama', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  PENDING_PAYMENT: { label: "To'lov kutilmoqda", className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200' },
  PAID: { label: "To'langan", className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  PACKING: { label: 'Tayyorlanmoqda', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  SHIPPED: { label: 'Yuborildi', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  DELIVERED: { label: 'Yetkazildi', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  CANCELED: { label: 'Bekor qilindi', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  REFUNDED: { label: 'Qaytarildi', className: 'bg-pink-100 text-pink-700 hover:bg-pink-100' },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: '' };
  
  return (
    <Badge variant="outline" className={cn('font-medium shadow-none px-2.5 py-0.5 rounded-full border-transparent', config.className, className)}>
      {config.label}
    </Badge>
  );
}
