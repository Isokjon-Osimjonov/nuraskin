import { PAID_STATUSES } from '@nuraskin/shared-utils';
import * as repository from './customers.repository';
import { db, productWaitlist, orders, stockReservations, products } from '@nuraskin/database';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import type { CustomerFilters, UpdateCustomerInput } from '@nuraskin/shared-types';



export async function listCustomersAdmin(filters: CustomerFilters) {
  return await repository.findAdminList(filters);
}

export async function getCustomerDetailAdmin(id: string) {
  const customer = await repository.findById(id);
  if (!customer) throw new NotFoundError('Mijoz topilmadi');

  // 1. Basic Stats
  const orderCount = await repository.getTotalOrderCount(id);
  const outstandingDebt = await repository.getOutstandingDebt(id);

  // 2. Order History (Last 20)
  const orderHistory = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      status: orders.status,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
    })
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  // 3. Active Reservations
  const activeReservations = await db
    .select({
      id: stockReservations.id,
      productId: stockReservations.productId,
      productName: products.name,
      quantity: stockReservations.quantity,
      createdAt: stockReservations.createdAt,
      expiresAt: stockReservations.expiresAt,
    })
    .from(stockReservations)
    .innerJoin(products, eq(stockReservations.productId, products.id))
    .where(and(
      eq(stockReservations.customerId, id as string),
      eq(stockReservations.status, 'ACTIVE')
    ));

  // 4. Waitlist
  const waitlist = await db
    .select({
      id: productWaitlist.id,
      productId: productWaitlist.productId,
      productName: products.name,
      createdAt: productWaitlist.createdAt,
    })
    .from(productWaitlist)
    .innerJoin(products, eq(productWaitlist.productId, products.id))
    .where(eq(productWaitlist.customerId, id as string))
    .orderBy(desc(productWaitlist.createdAt));

  // Calculate total spent KRW (KOR orders)
  const [totalSpentKrw] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)::text` })
    .from(orders)
    .where(and(
      eq(orders.customerId, id as string),
      eq(orders.regionCode, 'KOR'),
      inArray(orders.status, PAID_STATUSES)
    ));

  // Calculate total spent UZS (UZB orders)
  const [totalSpentUzs] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)::text` })
    .from(orders)
    .where(and(
      eq(orders.customerId, id as string),
      eq(orders.regionCode, 'UZB'),
      inArray(orders.status, PAID_STATUSES)
    ));

  return {
    ...customer,
    telegramId: customer.telegramId?.toString() || null,
    debtLimitOverride: customer.debtLimitOverride?.toString() || null,
    totalSpentKrw: totalSpentKrw.total,
    totalSpentUzs: totalSpentUzs.total,
    stats: {
      orderCount: Number(orderCount as any),
      totalSpent: (BigInt(totalSpentKrw.total) + BigInt(totalSpentUzs.total) / 100n).toString(), // mixed units, just for legacy
      outstandingDebt: BigInt(outstandingDebt as any).toString(),
      waitlistCount: waitlist.length,
    },
    orders: orderHistory.map(o => ({
      ...o,
      totalAmount: o.totalAmount.toString(),
    })),
    reservations: activeReservations,
    waitlist,
  };
}

export async function updateCustomerAdmin(id: string, input: UpdateCustomerInput) {
  const customer = await repository.findById(id);
  if (!customer) throw new NotFoundError('Mijoz topilmadi');

  const updateData: any = { ...input };
  if (input.debtLimitOverride !== undefined) {
    updateData.debtLimitOverride = input.debtLimitOverride ? BigInt(input.debtLimitOverride) : null;
  }

  return await repository.update(id, updateData);
}

export async function deleteCustomerAdmin(id: string) {
  const customer = await repository.findById(id);
  if (!customer) throw new NotFoundError('Mijoz topilmadi');

  const activeOrders = await repository.getActiveOrderCount(id);
  if (Number(activeOrders as any) > 0) {
    throw new ConflictError('Mijozda faol buyurtmalar bor, o\'chirish imkonsiz');
  }

  const debt = await repository.getOutstandingDebt(id);
  if (BigInt(debt as any) > 0n) {
    throw new ConflictError('Mijozda qarzdorlik bor, o\'chirish imkonsiz');
  }

  await repository.softDelete(id);
}
