import { PAID_STATUSES } from '@nuraskin/shared-utils';
import {
  db,
  orders,
  orderItems,
  products,
  inventoryBatches,
  settings,
  exchangeRateSnapshots,
  orderExpenses,
} from '@nuraskin/database';
import { eq, sql, and, desc, sum, count, inArray, countDistinct } from 'drizzle-orm';

export async function getKPIs(region: string) {
  const isAll = region === 'ALL';
  const todayKst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }); // YYYY-MM-DD

  const krwSubtotalAmountSql = sql`CASE 
    WHEN ${orders.regionCode} = 'KOR' THEN ${orders.subtotal}
    WHEN ${orders.regionCode} = 'UZB' THEN ROUND((${orders.subtotal}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
    ELSE ${orders.subtotal}
  END`;

  const krwDiscountAmountSql = sql`CASE 
    WHEN ${orders.regionCode} = 'KOR' THEN COALESCE(${orders.discountAmount}, 0)
    WHEN ${orders.regionCode} = 'UZB' THEN ROUND((COALESCE(${orders.discountAmount}, 0)::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
    ELSE COALESCE(${orders.discountAmount}, 0)
  END`;

  // 1. Today's Revenue & Orders
  const commonWhere = and(
    sql`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul') = ${todayKst}::date`,
    inArray(orders.status, PAID_STATUSES),
    isAll ? sql`1=1` : eq(orders.regionCode, region)
  );

  const orderStats = await db
    .select({
      revenue: sql<bigint>`coalesce(sum(${krwSubtotalAmountSql}), 0)::bigint`,
      discounts: sql<bigint>`coalesce(sum(${krwDiscountAmountSql}), 0)::bigint`,
      orderCount: countDistinct(orders.id),
      cargo: sql<bigint>`coalesce(sum(${orders.cargoCostKrw}), 0)::bigint`,
    })
    .from(orders)
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(commonWhere)
    .then(res => res[0]);

  const cogsStats = await db
    .select({
      cogs: sql<bigint>`coalesce(sum(${orderItems.costAtSaleKrw} * ${orderItems.quantity}), 0)::bigint`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(commonWhere)
    .then(res => res[0]);

  const grossRev = BigInt(orderStats?.revenue ?? '0');
  const discounts = BigInt(orderStats?.discounts ?? '0');
  const netRev = grossRev - discounts;
  const cogs = BigInt(cogsStats?.cogs ?? '0');
  const grossProfit = netRev - cogs;
  const margin = netRev > 0n ? Number((grossProfit * 10000n) / netRev) / 100 : 0;
  const orderCount = Number(orderStats?.orderCount ?? 0);

  // 2. Inventory Value (Live)
  const inventoryValue = await db
    .select({
      value: sql<bigint>`sum(${inventoryBatches.currentQty} * ${inventoryBatches.costPrice})::bigint`,
    })
    .from(inventoryBatches)
    .where(sql`${inventoryBatches.currentQty} > 0`)
    .then(res => res[0]?.value || 0n);

  // 3. Outstanding Debt
  const debt = await db
    .select({ total: sql<bigint>`coalesce(sum(${krwSubtotalAmountSql}), 0)::bigint` })
    .from(orders)
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(sql`${orders.status} IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')`)
    .then(res => res[0]?.total || '0');

  // 4. Action Queues
  const pendingVerification = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(
      and(
        sql`${orders.status} IN ('PAYMENT_SUBMITTED', 'PENDING_PAYMENT')`,
        sql`${orders.paymentReceiptUrl} IS NOT NULL`,
        sql`${orders.paymentVerifiedAt} IS NULL`,
        sql`${orders.paymentRejectedAt} IS NULL`
      )
    )
    .then(res => res[0]?.count || 0);

  const readyToPack = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(sql`${orders.status} IN ('PAYMENT_CONFIRMED')`)
    .then(res => res[0]?.count || 0);

  const expiringSoon = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(
      and(
        sql`${orders.status} IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')`,
        sql`${orders.paymentVerifiedAt} IS NULL`,
        sql`${orders.paymentRejectedAt} IS NULL`,
        sql`${orders.createdAt} < NOW() - INTERVAL '48 hours'`
      )
    )
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
    revenue_today_krw: netRev.toString(),
    gross_revenue_today_krw: grossRev.toString(),
    discounts_today_krw: discounts.toString(),
    orders_today: orderCount,
    margin_today_percent: margin,
    inventory_value_krw: inventoryValue.toString(),
    outstanding_debt_krw: debt.toString(),
    action_queues: {
      pending_payment_verification: pendingVerification,
      ready_to_pack: readyToPack,
      reservations_expiring_soon: expiringSoon,
      low_stock_skus: lowStockProducts.length,
    },
  };
}

export async function getTrend(region: string) {
  const isAll = region === 'ALL';

  const uzbRevenueKrwSql = sql<bigint>`coalesce(sum(case when ${orders.regionCode} = 'UZB' then ROUND((${orders.subtotal}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric) else 0 end), 0)::bigint`;

  // 1. Generate last 7 days in Asia/Seoul
  const last7DaysStrings = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  });

  // 2. Fetch last 7 days directly from orders table
  const summaryDays = await db
    .select({
      date: sql<string>`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul')::text`,
      kor_revenue_krw: sql<bigint>`sum(case when ${orders.regionCode} = 'KOR' then ${orders.totalAmount} else 0 end)::bigint`,
      uzb_revenue_krw: uzbRevenueKrwSql,
      total_orders: countDistinct(orders.id),
    })
    .from(orders)
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(
      and(
        inArray(orders.status, PAID_STATUSES),
        sql`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul') >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '6 days'`,
        isAll ? sql`1=1` : eq(orders.regionCode, region)
      )
    )
    .groupBy(
      sql`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul')`
    )
    .orderBy(
      sql`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul')`
    );

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
    .where(
      and(
        inArray(orders.status, PAID_STATUSES),
        sql`DATE(COALESCE(${orders.paymentConfirmedAt}, ${orders.deliveredAt}, ${orders.createdAt}) AT TIME ZONE 'Asia/Seoul') >= CURRENT_DATE AT TIME ZONE 'Asia/Seoul' - INTERVAL '6 days'`,
        isAll ? sql`1=1` : eq(orders.regionCode, region)
      )
    )
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
