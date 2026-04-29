import {
  db,
  products,
  productRegionalConfigs,
  inventoryBatches,
  categories,
  orders,
  orderItems,
  customers,
  settings,
  exchangeRateSnapshots,
  korShippingTiers,
  stockReservations,
} from '@nuraskin/database';
import { eq, and, isNull, sql, desc, inArray, asc } from 'drizzle-orm';
import type { OrderStatus, KorShippingTierInput } from '@nuraskin/shared-types';

export async function findActiveProducts(filters: { categoryId?: string; search?: string }) {
  const conditions = [isNull(products.deletedAt), eq(products.isActive, true)];

  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.search) {
    const s = `%${filters.search}%`;
    conditions.push(sql`(${products.name} ILIKE ${s} OR ${products.brandName} ILIKE ${s})`);
  }

  const baseProducts = await db
    .select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      brandName: products.brandName,
      imageUrls: products.imageUrls,
      categoryName: categories.name,
      weightGrams: products.weightGrams,
      showStockCount: products.showStockCount,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(and(...conditions))
    .groupBy(products.id, categories.name)
    .orderBy(products.name);

  // Fetch configs for all these products
  const productIds = baseProducts.map(p => p.id);
  const configs = productIds.length > 0 
    ? await db.select().from(productRegionalConfigs).where(inArray(productRegionalConfigs.productId, productIds))
    : [];

  return baseProducts.map(p => ({
    ...p,
    slug: p.barcode,
    configs: configs.filter(c => c.productId === p.id)
  }));
}

export async function findProductByBarcode(barcode: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      brandName: products.brandName,
      imageUrls: products.imageUrls,
      categoryName: categories.name,
      weightGrams: products.weightGrams,
      showStockCount: products.showStockCount,
      descriptionUz: products.descriptionUz,
      howToUseUz: products.howToUseUz,
      ingredients: products.ingredients,
      benefits: products.benefits,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(eq(products.barcode, barcode))
    .groupBy(products.id, categories.name)
    .limit(1);

  if (!product) return null;

  const configs = await db
    .select()
    .from(productRegionalConfigs)
    .where(eq(productRegionalConfigs.productId, product.id));

  return {
    ...product,
    slug: product.barcode,
    configs
  };
}

export async function findProductById(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      brandName: products.brandName,
      imageUrls: products.imageUrls,
      weightGrams: products.weightGrams,
      descriptionUz: products.descriptionUz,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return null;

  const configs = await db
    .select()
    .from(productRegionalConfigs)
    .where(eq(productRegionalConfigs.productId, id));

  return {
    ...product,
    slug: product.barcode,
    configs
  };
}

export async function getRegionalConfig(productId: string, regionCode: 'UZB' | 'KOR') {
  const [config] = await db
    .select()
    .from(productRegionalConfigs)
    .where(and(eq(productRegionalConfigs.productId, productId), eq(productRegionalConfigs.regionCode, regionCode)))
    .limit(1);
  return config || null;
}

export async function getStorefrontSettings() {
  const [row] = await db
    .select()
    .from(settings)
    .limit(1);
  return row || null;
}

export async function findCustomerByTelegramId(telegramId: bigint) {
  const [customer] = await db.select().from(customers).where(eq(customers.telegramId, telegramId)).limit(1);
  return customer || null;
}

export async function findCustomerById(id: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return customer || null;
}

export async function getMyOrders(customerId: string) {
  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      cargoFee: orders.cargoFee,
      paymentReceiptUrl: orders.paymentReceiptUrl,
      paymentSubmittedAt: orders.paymentSubmittedAt,
      paymentVerifiedAt: orders.paymentVerifiedAt,
      paymentNote: orders.paymentNote,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const results = [];
  for (const order of customerOrders) {
    const items = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        imageUrls: products.imageUrls,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPriceSnapshot,
        subtotal: orderItems.subtotalSnapshot,
        currency: orderItems.currencySnapshot,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const [resRow] = await db
      .select({ earliest: sql<string>`min(${stockReservations.expiresAt})::text` })
      .from(stockReservations)
      .where(and(
        eq(stockReservations.orderId, order.id),
        eq(stockReservations.status, 'ACTIVE')
      ));

    results.push({
      ...order,
      totalAmount: order.totalAmount.toString(),
      cargoFee: order.cargoFee.toString(),
      paymentExpiresAt: resRow?.earliest ?? null,
      items: items.map(i => ({
        ...i,
        unitPrice: i.unitPrice.toString(),
        subtotal: i.subtotal.toString()
      }))
    });
  }

  return results;
}

export async function getOrderForCustomer(orderId: string, customerId: string, tx?: any) {
  const d = tx || db;
  const [order] = await d
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
    .limit(1);

  if (!order) return null;

  const items = await d
    .select({
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPriceSnapshot,
      subtotal: orderItems.subtotalSnapshot,
      currency: orderItems.currencySnapshot,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const [resRow] = await d
    .select({ earliest: sql<string>`min(${stockReservations.expiresAt})::text` })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.orderId, orderId),
      eq(stockReservations.status, 'ACTIVE')
    ));

  return {
    ...order,
    paymentExpiresAt: resRow?.earliest ?? null,
    items,
  };
}

export async function listShippingTiers() {
  return await db.select().from(korShippingTiers).orderBy(asc(korShippingTiers.sortOrder));
}

export async function createShippingTier(input: KorShippingTierInput) {
    const [row] = await db.insert(korShippingTiers).values({
        ...input,
        maxOrderKrw: input.maxOrderKrw ? BigInt(input.maxOrderKrw) : null,
        cargoFeeKrw: BigInt(input.cargoFeeKrw),
    }).returning();
    return row;
}

export async function updateShippingTier(id: string, input: Partial<KorShippingTierInput>) {
    const updateData: any = { ...input };
    if (input.maxOrderKrw !== undefined) updateData.maxOrderKrw = input.maxOrderKrw ? BigInt(input.maxOrderKrw) : null;
    if (input.cargoFeeKrw !== undefined) updateData.cargoFeeKrw = BigInt(input.cargoFeeKrw);
    
    const [row] = await db.update(korShippingTiers).set(updateData).where(eq(korShippingTiers.id, id)).returning();
    return row;
}

export async function deleteShippingTier(id: string) {
    await db.delete(korShippingTiers).where(eq(korShippingTiers.id, id));
}
