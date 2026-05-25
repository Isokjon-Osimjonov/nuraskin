import { db, orders, orderItems, products, inventoryBatches, settings, exchangeRateSnapshots } from '@nuraskin/database';
import { eq, sql, and, gte, lte, desc, sum, count, countDistinct } from 'drizzle-orm';
import { logger } from '../../common/utils/logger';

export async function getKPIs(region: string) {
  const isAll = region === 'ALL';
  const todayKst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD

  const krwTotalAmountSql = sql`CASE 
    WHEN ${orders.regionCode} = 'KOR' THEN ${orders.totalAmount}
    WHEN ${orders.regionCode} = 'UZB' THEN ROUND((${orders.totalAmount}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
    ELSE ${orders.totalAmount}
  END`;

  const krwDiscountAmountSql = sql`CASE 
    WHEN ${orders.regionCode} = 'KOR' THEN COALESCE(${orders.discountAmount}, 0)
    WHEN ${orders.regionCode} = 'UZB' THEN ROUND((COALESCE(${orders.discountAmount}, 0)::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
    ELSE COALESCE(${orders.discountAmount}, 0)
  END`;

  // 1. Today's Revenue & Orders
  const todayStats = await db
    .select({
      revenue: sql<bigint>`coalesce(sum(${krwTotalAmountSql}), 0)::bigint`,
      discounts: sql<bigint>`coalesce(sum(${krwDiscountAmountSql}), 0)::bigint`,
      orderCount: count(orders.id),
      cogs: sql<bigint>`coalesce(sum(${orderItems.costAtSaleKrw} * ${orderItems.quantity}), 0)::bigint`,
      cargo: sum(orders.cargoCostKrw),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(and(
      sql`DATE(${orders.deliveredAt} AT TIME ZONE 'Asia/Seoul') = ${todayKst}::date`,
      eq(orders.status, 'DELIVERED'),
      isAll ? sql`1=1` : eq(orders.regionCode, region)
    ))
    .then(res => res[0]);

  const rev = BigInt(todayStats?.revenue ?? '0');
  const discounts = BigInt(todayStats?.discounts ?? '0');
  const grossRev = rev + discounts;
  const cogs = BigInt(todayStats?.cogs ?? '0');
  const cargo = BigInt(todayStats?.cargo ?? '0');
  const grossProfit = rev - cogs - cargo;
  const margin = rev > 0n ? Number(grossProfit * 10000n / rev) / 100 : 0;

  // 2. Inventory Value (Live)
  const inventoryValue = await db
    .select({ value: sql<bigint>`sum(${inventoryBatches.currentQty} * ${inventoryBatches.costPrice})::bigint` })
    .from(inventoryBatches)
    .where(sql`${inventoryBatches.currentQty} > 0`)
    .then(res => res[0]?.value || 0n);

  // 3. Outstanding Debt
  const debt = await db
    .select({ total: sql<bigint>`coalesce(sum(${krwTotalAmountSql}), 0)::bigint` })
    .from(orders)
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(sql`${orders.status} IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')`)
    .then(res => res[0]?.total || '0');

  // 4. Action Queues
  const pendingVerification = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(and(
      sql`${orders.status} IN ('PAYMENT_SUBMITTED', 'PENDING_PAYMENT')`,
      sql`${orders.paymentReceiptUrl} IS NOT NULL`,
      sql`${orders.paymentVerifiedAt} IS NULL`,
      sql`${orders.paymentRejectedAt} IS NULL`
    ))
    .then(res => res[0]?.count || 0);

  const readyToPack = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(sql`${orders.status} IN ('PAID', 'PAYMENT_VERIFIED')`)
    .then(res => res[0]?.count || 0);

  const expiringSoon = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(and(
      sql`${orders.status} IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')`,
      sql`${orders.paymentVerifiedAt} IS NULL`,
      sql`${orders.paymentRejectedAt} IS NULL`,
      sql`${orders.createdAt} < NOW() - INTERVAL '48 hours'`
    ))
    .then(res => res[0]?.count || 0);

  const [settingsRow] = await db.select().from(settings).limit(1);
  const globalThreshold = settingsRow?.lowStockThreshold || 10;

  const lowStockProducts = await db
    .select({
      id: products.id,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty}), 0)::int`,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(eq(products.isActive, true))
    .groupBy(products.id)
    .having(sql`coalesce(sum(${inventoryBatches.currentQty}), 0) < ${globalThreshold}`);

  return {
    revenue_today_krw: rev.toString(),
    gross_revenue_today_krw: grossRev.toString(),
    discounts_today_krw: discounts.toString(),
    orders_today: todayStats.orderCount,
    margin_today_percent: margin,
    inventory_value_krw: inventoryValue.toString(),
    outstanding_debt_krw: debt.toString(),
    action_queues: {
      pending_payment_verification: pendingVerification,
      ready_to_pack: readyToPack,
      reservations_expiring_soon: expiringSoon,
      low_stock_skus: lowStockProducts.length,
    }
  };
}

export async function getTrend(region: string) {
  const isAll = region === 'ALL';

  const uzbRevenueKrwSql = sql<bigint>`coalesce(sum(case when ${orders.regionCode} = 'UZB' then ROUND((${orders.totalAmount}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric) else 0 end), 0)::bigint`;

  // 1. Generate last 7 days in Asia/Seoul
  const last7DaysStrings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  });

  // 2. Fetch last 7 days directly from orders table
  const summaryDays = await db
    .select({
      date: sql<string>`DATE(${orders.deliveredAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::text`,
      kor_revenue_krw: sql<bigint>`sum(case when ${orders.regionCode} = 'KOR' then ${orders.totalAmount} else 0 end)::bigint`,
      uzb_revenue_krw: uzbRevenueKrwSql,
      total_orders: count(orders.id),
    })
    .from(orders)
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(and(
      eq(orders.status, 'DELIVERED'),
      sql`${orders.deliveredAt} IS NOT NULL`,
      sql`DATE(${orders.deliveredAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '6 days'`,
      isAll ? sql`1=1` : eq(orders.regionCode, region)
    ))
    .groupBy(sql`DATE(${orders.deliveredAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')`)
    .orderBy(sql`DATE(${orders.deliveredAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')`);

  const revenueMap = new Map(summaryDays.map(d => [d.date, d]));

  const days = last7DaysStrings.map(date => {
    const d = revenueMap.get(date);
    return {
      date,
      kor_revenue_krw: (d?.kor_revenue_krw ?? 0n).toString(),
      uzb_revenue_krw: (d?.uzb_revenue_krw ?? 0n).toString(),
      total_orders: Number(d?.total_orders || 0),
    };
  });

  // 3. Top 5 SKUs last 7 days
  const topSkus = await db
    .select({
      product_id: orderItems.productId,
      product_name: products.name,
      units_sold: sum(orderItems.quantity),
      revenue_krw: sql<bigint>`sum(
        CASE 
          WHEN ${orders.regionCode} = 'KOR' THEN ${orderItems.subtotalSnapshot}
          WHEN ${orders.regionCode} = 'UZB' THEN ROUND((${orderItems.subtotalSnapshot}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
          ELSE ${orderItems.subtotalSnapshot}
        END
      )::bigint`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(and(
      eq(orders.status, 'DELIVERED'),
      sql`${orders.deliveredAt} IS NOT NULL`,
      sql`DATE(${orders.deliveredAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '6 days'`,
      isAll ? sql`1=1` : eq(orders.regionCode, region)
    ))
    .groupBy(orderItems.productId, products.name, exchangeRateSnapshots.krwToUzs)
    .orderBy(desc(sql`sum(${orderItems.subtotalSnapshot})`))
    .limit(5);

  return {
    days: days.sort((a, b) => a.date.localeCompare(b.date)).slice(-7),
    top_skus: topSkus.map(s => ({
      ...s,
      units_sold: Number(s.units_sold || 0),
      revenue_krw: (s.revenue_krw || '0').toString(),
    })),
  };
}
