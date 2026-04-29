import { createFileRoute } from '@tanstack/react-router';
import { ProductsPage } from '../../../app/products/ProductsListPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/products/')({
  validateSearch: searchSchema,
  component: ProductsPage,
});
