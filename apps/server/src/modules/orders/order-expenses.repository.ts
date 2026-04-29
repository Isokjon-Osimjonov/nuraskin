import { db, orderExpenses, users } from '@nuraskin/database';
import { eq, desc } from 'drizzle-orm';

export async function create(data: typeof orderExpenses.$inferInsert) {
  const [row] = await db.insert(orderExpenses).values(data).returning();
  return row;
}

export async function findByOrderId(orderId: string) {
  const rows = await db
    .select({
      expense: orderExpenses,
      createdByName: users.fullName,
    })
    .from(orderExpenses)
    .leftJoin(users, eq(orderExpenses.createdBy, users.id))
    .where(eq(orderExpenses.orderId, orderId))
    .orderBy(desc(orderExpenses.createdAt));

  return rows.map((r) => ({
    ...r.expense,
    amountKrw: r.expense.amountKrw.toString(),
    createdByName: r.createdByName,
  }));
}

export async function findById(id: string) {
  const [row] = await db.select().from(orderExpenses).where(eq(orderExpenses.id, id)).limit(1);
  return row;
}

export async function deleteById(id: string) {
  await db.delete(orderExpenses).where(eq(orderExpenses.id, id));
}
