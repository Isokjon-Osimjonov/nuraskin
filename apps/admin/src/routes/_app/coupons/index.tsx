import { createFileRoute } from '@tanstack/react-router';
import { CouponsListPage } from '@/app/coupons/CouponsListPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/coupons/')({
  validateSearch: searchSchema,
  component: CouponsListPage,
});
