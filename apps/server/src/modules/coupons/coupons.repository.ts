import { db, coupons, couponRedemptions, orders, customers } from '@nuraskin/database';
import { eq, and, sql, isNull, like, or, desc } from 'drizzle-orm';
import type { NewCoupon, Coupon } from '@nuraskin/database';

export async function findByCode(code: string, tx: any = db) {
  const [row] = await tx
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code.toUpperCase()), isNull(coupons.deletedAt)))
    .limit(1);
  return row || null;
}

export async function findById(id: string) {
  const [row] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.id, id), isNull(coupons.deletedAt)))
    .limit(1);
  return row || null;
}

export async function list(filters: { status?: string; search?: string; page: number; limit: number }) {
  const offset = (filters.page - 1) * filters.limit;
  
  let conditions = [isNull(coupons.deletedAt)];
  if (filters.status && filters.status !== 'ALL') {
    conditions.push(eq(coupons.status, filters.status));
  }
  if (filters.search) {
    conditions.push(or(
      like(coupons.code, `%${filters.search.toUpperCase()}%`),
      like(coupons.name, `%${filters.search}%`)
    ) as any);
  }

  const data = await db
    .select()
    .from(coupons)
    .where(and(...conditions))
    .orderBy(desc(coupons.createdAt))
    .limit(filters.limit)
    .offset(offset);

  const [total] = await db
    .select({ count: sql`count(*)::int` })
    .from(coupons)
    .where(and(...conditions));

  return { data, total: total.count };
}

export async function create(data: NewCoupon) {
  const [row] = await db.insert(coupons).values({
    ...data,
    code: data.code.toUpperCase(),
  }).returning();
  return row;
}

export async function update(id: string, data: Partial<Coupon>) {
  const [row] = await db
    .update(coupons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(coupons.id, id))
    .returning();
  return row;
}

export async function softDelete(id: string) {
  await db
    .update(coupons)
    .set({ status: 'ARCHIVED', deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(coupons.id, id));
}

export async function incrementUsage(id: string, tx: any) {
  // ATOMIC: Lock the row first
  const [row] = await tx
    .select({ usageCount: coupons.usageCount })
    .from(coupons)
    .where(eq(coupons.id, id))
    .for('update');

  if (!row) return;

  await tx
    .update(coupons)
    .set({ usageCount: row.usageCount + 1, updatedAt: new Date() })
    .where(eq(coupons.id, id));
}

export async function findRedemptions(couponId: string) {
  return await db
    .select({
      id: couponRedemptions.id,
      discountAmount: couponRedemptions.discountAmount,
      createdAt: couponRedemptions.createdAt,
      orderNumber: orders.orderNumber,
      orderId: orders.id,
      customerName: customers.fullName,
      customerId: customers.id,
    })
    .from(couponRedemptions)
    .innerJoin(orders, eq(couponRedemptions.orderId, orders.id))
    .innerJoin(customers, eq(couponRedemptions.customerId, customers.id))
    .where(eq(couponRedemptions.couponId, couponId))
    .orderBy(desc(couponRedemptions.createdAt));
}

export async function getCustomerUsageCount(couponId: string, customerId: string, tx: any = db) {
    const [row] = await tx
        .select({ count: sql`count(*)::int` })
        .from(couponRedemptions)
        .where(and(
            eq(couponRedemptions.couponId, couponId),
            eq(couponRedemptions.customerId, customerId)
        ));
    return row.count;
}

export async function getCustomerOrderCount(customerId: string, tx: any = db) {
    const [row] = await tx
        .select({ count: sql`count(*)::int` })
        .from(orders)
        .where(and(
            eq(orders.customerId, customerId),
            sql`status != 'CANCELED'`
        ));
    return row.count;
}
