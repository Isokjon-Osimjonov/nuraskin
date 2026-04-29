import { createFileRoute } from '@tanstack/react-router';
import { ChannelsPage } from '@/app/telegram/ChannelsPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/telegram/channels')({
  validateSearch: searchSchema,
  component: ChannelsPage,
});
