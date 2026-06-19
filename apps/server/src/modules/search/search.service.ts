import { db, products, customers, orders } from '@nuraskin/database';
import { ilike, or, sql, eq, and, isNull } from 'drizzle-orm';
import type { GlobalSearchResponse } from '@nuraskin/shared-types';

const SEARCH_RESULT_LIMIT_PER_TYPE = 5;

export async function globalSearch(q: string): Promise<GlobalSearchResponse> {
  const term = `%${q}%`;

  const [productsData, customersData, ordersData, productsCount, customersCount, ordersCount] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        imageUrls: products.imageUrls,
        barcode: products.barcode,
        sku: products.sku,
      })
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.isActive, true),
          or(
            ilike(products.name, term),
            ilike(products.barcode, term),
            ilike(products.sku, term),
            ilike(products.brandName, term)
          )
        )
      )
      .limit(SEARCH_RESULT_LIMIT_PER_TYPE),
    
    db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        telegramId: sql<string>`customers.telegram_id::text`,
      })
      .from(customers)
      .where(
        and(
          isNull(customers.deletedAt),
          or(
            ilike(customers.fullName, term),
            ilike(customers.phone, term),
            sql`customers.telegram_id::text ILIKE ${term}`
          )
        )
      )
      .limit(SEARCH_RESULT_LIMIT_PER_TYPE),

    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: sql<string>`orders.total_amount::text`,
        status: orders.status,
        currency: orders.currency,
      })
      .from(orders)
      .where(
        or(
          ilike(orders.orderNumber, term)
        )
      )
      .limit(SEARCH_RESULT_LIMIT_PER_TYPE),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.isActive, true),
          or(
            ilike(products.name, term),
            ilike(products.barcode, term),
            ilike(products.sku, term),
            ilike(products.brandName, term)
          )
        )
      ),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          isNull(customers.deletedAt),
          or(
            ilike(customers.fullName, term),
            ilike(customers.phone, term),
            sql`customers.telegram_id::text ILIKE ${term}`
          )
        )
      ),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        or(
          ilike(orders.orderNumber, term)
        )
      ),
  ]);

  return {
    products: productsData.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrls?.[0] || null,
      barcode: p.barcode,
      sku: p.sku,
    })),
    customers: customersData.map(c => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      telegramId: c.telegramId,
    })),
    orders: ordersData.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      currency: o.currency,
    })),
    totalCounts: {
      products: productsCount[0]?.count || 0,
      customers: customersCount[0]?.count || 0,
      orders: ordersCount[0]?.count || 0,
    },
  };
}
