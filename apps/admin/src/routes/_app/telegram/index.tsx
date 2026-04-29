import { createFileRoute } from '@tanstack/react-router';
import { TelegramDashboard } from '@/app/telegram/TelegramDashboard';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/telegram/')({
  validateSearch: searchSchema,
  component: TelegramDashboard,
});
