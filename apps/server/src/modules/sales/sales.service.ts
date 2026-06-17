import { PAID_STATUSES } from '@nuraskin/shared-utils';
import { db, orders, customers, exchangeRateSnapshots } from '@nuraskin/database';
import { eq, sql, and, desc, count, inArray } from 'drizzle-orm';

export async function listSalesOrders(
  from?: string,
  to?: string,
  regionCode?: string,
  page = 1,
  limit = 10
) {
  const seoulTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const endDate = to || seoulTodayStr;
  const seoulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const startDate = from || new Date(seoulNow.setDate(seoulNow.getDate() - 30)).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

  const offset = (page - 1) * limit;
  let regionFilter = sql`1=1`;
  if (regionCode && regionCode.toLowerCase() !== 'all') {
    regionFilter = sql`${orders.regionCode} = ${regionCode.toUpperCase()}`;
  }

  const whereClauses = and(
    inArray(orders.status, PAID_STATUSES),
    sql`DATE(${orders.paymentConfirmedAt} AT TIME ZONE 'Asia/Seoul') >= ${startDate}::date`,
    sql`DATE(${orders.paymentConfirmedAt} AT TIME ZONE 'Asia/Seoul') <= ${endDate}::date`,
    regionFilter
  );

  const totalCount = await db
    .select({ count: count() })
    .from(orders)
    .where(whereClauses)
    .then(res => res[0]?.count || 0);

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      regionCode: orders.regionCode,
      totalAmount: orders.totalAmount,
      totalAmountKrw: sql<bigint>`CASE 
        WHEN ${orders.regionCode} = 'KOR' THEN ${orders.totalAmount}
        WHEN ${orders.regionCode} = 'UZB' THEN ROUND((${orders.totalAmount}::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
        ELSE ${orders.totalAmount}
      END`,
      discountAmount: orders.discountAmount,
      couponCode: orders.couponCode,
      discountAmountKrw: sql<bigint>`CASE 
        WHEN ${orders.regionCode} = 'KOR' THEN COALESCE(${orders.discountAmount}, 0)
        WHEN ${orders.regionCode} = 'UZB' THEN ROUND((COALESCE(${orders.discountAmount}, 0)::numeric / 100) / COALESCE(${exchangeRateSnapshots.krwToUzs}, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
        ELSE COALESCE(${orders.discountAmount}, 0)
      END`,
      deliveredAt: orders.deliveredAt,
      paymentConfirmedAt: orders.paymentConfirmedAt,
      customerName: customers.fullName,
      currency: orders.currency,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(exchangeRateSnapshots, eq(orders.rateSnapshotId, exchangeRateSnapshots.id))
    .where(whereClauses)
    .orderBy(desc(orders.paymentConfirmedAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(r => ({
      ...r,
      totalAmount: r.totalAmount.toString(),
      totalAmountKrw: r.totalAmountKrw.toString(),
      discountAmount: r.discountAmount ? r.discountAmount.toString() : '0',
      discountAmountKrw: r.discountAmountKrw.toString(),
    })),
    total: totalCount,
  };
}

export async function getLiveSales(from?: string, to?: string, regionCode?: string) {
  const seoulTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const endDate = to || seoulTodayStr;
  const seoulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const startDate = from || new Date(seoulNow.setDate(seoulNow.getDate() - 30)).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

  let regionFilter = sql`1=1`;
  if (regionCode && regionCode.toLowerCase() !== 'all') {
    regionFilter = sql`o.region_code = ${regionCode.toUpperCase()}`;
  }

  const rawData = await db.execute(sql`
    SELECT
      DATE(o.payment_confirmed_at AT TIME ZONE 'Asia/Seoul') as sale_date,
      o.region_code,
      o.cargo_fee,
      o.total_weight_grams,
      o.id as order_id,
      oi.product_id,
      oi.quantity,
      CASE 
        WHEN o.region_code = 'KOR' THEN oi.unit_price_snapshot
        WHEN o.region_code = 'UZB' THEN 
          ROUND((oi.unit_price_snapshot::numeric / 100) / COALESCE(ers.krw_to_uzs, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
        ELSE oi.unit_price_snapshot
      END as unit_price_krw,
      CASE 
        WHEN o.region_code = 'KOR' THEN COALESCE(o.discount_amount, 0)
        WHEN o.region_code = 'UZB' THEN 
          ROUND((COALESCE(o.discount_amount, 0)::numeric / 100) / COALESCE(ers.krw_to_uzs, (SELECT krw_to_uzs FROM exchange_rate_snapshots ORDER BY created_at DESC LIMIT 1))::numeric)
        ELSE COALESCE(o.discount_amount, 0)
      END as discount_krw,
      oi.cost_at_sale_krw,
      p.weight_grams,
      p.name as product_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN exchange_rate_snapshots ers ON o.rate_snapshot_id = ers.id
    WHERE o.status IN ('PAYMENT_CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED')
      AND DATE(o.payment_confirmed_at AT TIME ZONE 'Asia/Seoul') >= ${startDate}::date
      AND DATE(o.payment_confirmed_at AT TIME ZONE 'Asia/Seoul') <= ${endDate}::date
      AND ${regionFilter}
  `);

  return processSalesRows(rawData.rows as any[]);
}

export async function getSummarySales(from?: string, to?: string, regionCode?: string) {
  // Use the exact same logic as getLiveSales so we don't depend on the daily rollup job latency
  return getLiveSales(from, to, regionCode);
}

function processSalesRows(rows: any[]) {
  let totalRevenue = 0n;
  let totalCogs = 0n;
  let totalCargo = 0n;
  let totalDiscounts = 0n;
  const uniqueOrders = new Set<string>();

  const byDate: Record<string, { date: string; KOR: bigint; UZB: bigint; total: bigint }> = {};
  const byProduct: Record<string, any> = {};

  for (const row of rows) {
    const qty = Number(row.quantity);
    const rev = BigInt(row.unit_price_krw || 0) * BigInt(qty);
    const cogs = BigInt(row.cost_at_sale_krw || 0) * BigInt(qty);

    const orderTotalWeight = Number(row.total_weight_grams || 0);
    const itemWeight = Number(row.weight_grams || 0) * qty;
    const orderCargo = BigInt(row.cargo_fee || 0n);
    let cargo = 0n;

    if (orderTotalWeight > 0) {
      cargo = (orderCargo * BigInt(Math.round(itemWeight))) / BigInt(orderTotalWeight);
    }

    totalRevenue += rev;
    totalCogs += cogs;
    totalCargo += cargo;

    if (!uniqueOrders.has(row.order_id)) {
      totalDiscounts += BigInt(row.discount_krw || 0n);
    }

    uniqueOrders.add(row.order_id);

    const dateStr =
      row.sale_date instanceof Date ? row.sale_date.toISOString().split('T')[0] : row.sale_date;
    if (!byDate[dateStr]) byDate[dateStr] = { date: dateStr, KOR: 0n, UZB: 0n, total: 0n };
    if (row.region_code === 'KOR') byDate[dateStr].KOR += rev;
    if (row.region_code === 'UZB') byDate[dateStr].UZB += rev;
    byDate[dateStr].total += rev;

    const pId = row.product_id;
    if (!byProduct[pId]) {
      byProduct[pId] = {
        productId: pId,
        productName: row.product_name,
        unitsSold: 0,
        revenueKrw: 0n,
        cogsKrw: 0n,
        cargoKrw: 0n,
        regionCode: row.region_code,
      };
    } else if (byProduct[pId].regionCode !== row.region_code) {
      byProduct[pId].regionCode = 'Ikkalasi';
    }

    byProduct[pId].unitsSold += qty;
    byProduct[pId].revenueKrw += rev;
    byProduct[pId].cogsKrw += cogs;
    byProduct[pId].cargoKrw += cargo;
  }

  return formatResponse(
    totalRevenue,
    totalCogs,
    totalCargo,
    uniqueOrders.size,
    byDate,
    byProduct,
    totalDiscounts
  );
}

function formatResponse(
  totalRevenue: bigint,
  totalCogs: bigint,
  totalCargo: bigint,
  orderCount: number,
  byDate: any,
  byProduct: any,
  totalDiscounts: bigint
) {
  const netRevenue = totalRevenue - totalDiscounts;
  const marginStr =
    netRevenue > 0n
      ? ((Number(netRevenue - totalCogs) / Number(netRevenue)) * 100).toFixed(1) + '%'
      : '0.0%';

  return {
    summary: {
      revenueKrw: netRevenue.toString(),
      grossRevenueKrw: totalRevenue.toString(),
      discountsKrw: totalDiscounts.toString(),
      cogsKrw: totalCogs.toString(),
      cargoKrw: totalCargo.toString(),
      orderCount,
      grossMargin: marginStr,
    },
    byDate: Object.values(byDate)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((d: any) => ({
        ...d,
        KOR: d.KOR.toString(),
        UZB: d.UZB.toString(),
        total: d.total.toString(),
      })),
    byProduct: Object.values(byProduct)
      .map((p: any) => ({
        ...p,
        revenueKrw: p.revenueKrw.toString(),
        cogsKrw: p.cogsKrw.toString(),
        cargoKrw: p.cargoKrw.toString(),
        grossMargin:
          p.revenueKrw > 0n
            ? (
                (Number(p.revenueKrw - p.cogsKrw) / Number(p.revenueKrw)) *
                100
              ).toFixed(1) + '%'
            : '0.0%',
      }))
      .sort((a: any, b: any) => parseFloat(b.grossMargin) - parseFloat(a.grossMargin)),
  };
}
