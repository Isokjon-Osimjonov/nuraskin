import { db, customers, orders, settings } from '@nuraskin/database';
import { eq, and, like, or, sql, isNull, desc } from 'drizzle-orm';
import type { CustomerListItem, CustomerFilters } from '@nuraskin/shared-types';

export async function findAdminList(filters: CustomerFilters) {
  const { page, limit, region, status, debtStatus, search } = filters;
  const offset = (page - 1) * limit;

  const [settingsRow] = await db.select().from(settings).limit(1);
  const defaultLimit = settingsRow?.debtLimitDefault ?? 0n;

  // Complex query with aggregated stats
  const baseQuery = db
    .select({
      id: customers.id,
      telegramId: sql<string>`customers.telegram_id::text`.as('telegramId'),
      phone: customers.phone,
      fullName: customers.fullName,
      regionCode: customers.regionCode,
      isActive: customers.isActive,
      createdAt: sql<string>`customers.created_at::text`.as('createdAt'),
      lastOrderAt: sql<string | null>`MAX(orders.created_at)::text`.as('lastOrderAt'),
      orderCount: sql<number>`COUNT(orders.id)::int`.as('orderCount'),
      totalSpent: sql<string>`COALESCE(SUM(CASE WHEN orders.status = 'DELIVERED' THEN orders.total_amount ELSE 0 END), 0)::text`.as('totalSpent'),
      outstandingDebt: sql<string>`COALESCE(SUM(CASE WHEN orders.status = 'PENDING_PAYMENT' THEN orders.total_amount ELSE 0 END), 0)::text`.as('outstandingDebt'),
      debtLimit: sql<string>`COALESCE(customers.debt_limit_override, ${defaultLimit})::text`.as('debtLimit'),
    })
    .from(customers)
    .leftJoin(orders, eq(customers.id, orders.customerId))
    .where(isNull(customers.deletedAt))
    .groupBy(customers.id);

  // Apply filters
  const conditions = [isNull(customers.deletedAt)];
  
  if (region !== 'ALL') conditions.push(eq(customers.regionCode, region));
  if (status === 'active') conditions.push(eq(customers.isActive, true));
  if (status === 'inactive') conditions.push(eq(customers.isActive, false));
  
  if (search) {
    conditions.push(or(
      like(customers.fullName, `%${search}%`),
      like(customers.phone, `%${search}%`),
      sql`customers.telegram_id::text LIKE ${'%' + search + '%'}`
    ) as any);
  }

  // Unfortunately groupBy + having for debtStatus is complex in Drizzle with subqueries.
  // We'll wrap the base query as a subquery.
  
  const subquery = baseQuery.as('stats');
  let finalQuery = db.select().from(subquery);

  if (debtStatus !== 'ALL') {
    if (debtStatus === 'BLOCKED') {
      finalQuery = finalQuery.where(sql`stats.outstanding_debt::bigint >= stats.debt_limit::bigint`) as any;
    } else if (debtStatus === 'WARNING') {
      finalQuery = finalQuery.where(sql`stats.outstanding_debt::bigint >= (stats.debt_limit::bigint * 80 / 100) AND stats.outstanding_debt::bigint < stats.debt_limit::bigint`) as any;
    } else if (debtStatus === 'GOOD') {
      finalQuery = finalQuery.where(sql`stats.outstanding_debt::bigint < (stats.debt_limit::bigint * 80 / 100)`) as any;
    }
  }

  const data = await finalQuery
    .limit(limit)
    .offset(offset);

  const [totalCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(customers)
    .where(and(...conditions));

  return {
    data: data as any as CustomerListItem[],
    total: totalCount.count,
  };
}

export async function findById(id: string) {
  const [customer] = await db.select().from(customers).where(and(eq(customers.id, id), isNull(customers.deletedAt))).limit(1);
  return customer || null;
}

export async function update(id: string, data: any) {
  const [updated] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return updated;
}

export async function softDelete(id: string) {
  await db
    .update(customers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(customers.id, id));
}

export async function getActiveOrderCount(customerId: string) {
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(orders)
    .where(and(
      eq(orders.customerId, customerId),
      sql`orders.status NOT IN ('CANCELED', 'DELIVERED')`
    ));
  return row.count;
}

export async function getTotalOrderCount(customerId: string) {
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(orders)
    .where(and(
      eq(orders.customerId, customerId),
      sql`orders.status NOT IN ('CANCELED', 'REFUNDED')`
    ));
  return row.count;
}

export async function getOutstandingDebt(customerId: string) {
  const [row] = await db
    .select({ total: sql`coalesce(sum(total_amount), 0)::bigint` })
    .from(orders)
    .where(and(
      eq(orders.customerId, customerId),
      eq(orders.status, 'PENDING_PAYMENT')
    ));
  return row.total;
}
