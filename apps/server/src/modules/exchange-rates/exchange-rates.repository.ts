import { db, exchangeRateSnapshots, type NewExchangeRateSnapshot } from '@nuraskin/database';
import { desc } from 'drizzle-orm';

export async function getLatest() {
  const [row] = await db
    .select()
    .from(exchangeRateSnapshots)
    .orderBy(desc(exchangeRateSnapshots.createdAt))
    .limit(1);
  return row ? { ...row, krwToUzs: Number(row.krwToUzs) } : null;
}

export async function findAll() {
  const rows = await db
    .select()
    .from(exchangeRateSnapshots)
    .orderBy(desc(exchangeRateSnapshots.createdAt));
  return rows.map((row) => ({
    ...row,
    krwToUzs: Number(row.krwToUzs),
  }));
}

export async function create(data: NewExchangeRateSnapshot) {
  const [row] = await db.insert(exchangeRateSnapshots).values(data).returning();
  return { ...row, krwToUzs: Number(row.krwToUzs) };
}
