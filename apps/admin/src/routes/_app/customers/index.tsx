import { createFileRoute } from '@tanstack/react-router';
import { CustomersListPage } from '@/app/customers/CustomersListPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/customers/')({
  validateSearch: searchSchema,
  component: CustomersListPage,
});
