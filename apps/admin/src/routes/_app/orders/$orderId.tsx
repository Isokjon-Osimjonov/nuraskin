import { createFileRoute } from '@tanstack/react-router';
import { OrderDetailPage } from '../../../app/orders/OrderDetailPage';

export const Route = createFileRoute('/_app/orders/$orderId')({
  component: OrderDetailPage,
});
