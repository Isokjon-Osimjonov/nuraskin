import { createFileRoute } from '@tanstack/react-router';
import { TeamListPage } from '@/app/settings/team/TeamListPage';
import { z } from 'zod';

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute('/_app/settings/team')({
  validateSearch: searchSchema,
  component: TeamListPage,
});
