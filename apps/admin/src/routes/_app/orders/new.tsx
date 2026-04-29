import { createFileRoute } from '@tanstack/react-router';
import { OrderCreatePage } from '../../../app/orders/OrderCreatePage';

export const Route = createFileRoute('/_app/orders/new')({
  component: OrderCreatePage,
});
