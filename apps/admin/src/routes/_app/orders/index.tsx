import { createFileRoute } from '@tanstack/react-router';
import { OrdersListPage } from '../../../app/orders/OrdersListPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/orders/')({
  validateSearch: searchSchema,
  component: OrdersListPage,
});
