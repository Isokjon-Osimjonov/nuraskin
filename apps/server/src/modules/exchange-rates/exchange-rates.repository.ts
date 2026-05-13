import { db, exchangeRateSnapshots, users, type NewExchangeRateSnapshot } from '@nuraskin/database';
import { desc, eq } from 'drizzle-orm';

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
    .select({
      snapshot: exchangeRateSnapshots,
      userFullName: users.fullName,
    })
    .from(exchangeRateSnapshots)
    .leftJoin(users, eq(exchangeRateSnapshots.createdBy, users.id))
    .orderBy(desc(exchangeRateSnapshots.createdAt))
    .limit(10);
    
  return rows.map((row) => ({
    ...row.snapshot,
    krwToUzs: Number(row.snapshot.krwToUzs),
    createdByName: row.userFullName,
  }));
}

export async function create(data: NewExchangeRateSnapshot) {
  const [row] = await db.insert(exchangeRateSnapshots).values(data).returning();
  return { ...row, krwToUzs: Number(row.krwToUzs) };
}
