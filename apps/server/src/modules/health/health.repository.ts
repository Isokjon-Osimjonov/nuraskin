import { db, healthChecks } from '@nuraskin/database';
import { desc } from 'drizzle-orm';
import type { HealthCheck } from '@nuraskin/database';

export async function findLatest(): Promise<HealthCheck | null> {
  const rows = await db
    .select()
    .from(healthChecks)
    .orderBy(desc(healthChecks.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
