import { createFileRoute } from '@tanstack/react-router';
import { InventoryOverviewPage } from '../../../app/inventory/InventoryOverviewPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/inventory/')({
  validateSearch: searchSchema,
  component: InventoryOverviewPage,
});
