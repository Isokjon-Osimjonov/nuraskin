import { db, orders, orderItems, products, dailySalesSummary } from '@nuraskin/database';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { BadRequestError } from '../../common/errors/AppError';

function getLiveDateFilters(from: string, to: string) {
  return [
    sql`DATE(${orders.shippedAt}) >= ${from}::date OR DATE(${orders.deliveredAt}) >= ${from}::date`,
    sql`DATE(${orders.shippedAt}) <= ${to}::date OR DATE(${orders.deliveredAt}) <= ${to}::date`,
  ];
}

export async function getLiveSales(from: string, to: string, regionCode?: string) {
  const dateFilters = getLiveDateFilters(from, to);
  let regionFilter = sql`1=1`;
  if (regionCode) {
    regionFilter = eq(orders.regionCode, regionCode);
  }

  // Live Query
  const rawData = await db.execute(sql`
    SELECT 
      DATE(COALESCE(o.delivered_at, o.shipped_at)) as sale_date,
      o.region_code,
      o.cargo_fee,
      o.total_weight_grams,
      o.id as order_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price_snapshot,
      oi.cost_at_sale_krw,
      p.weight_grams,
      p.name as product_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status IN ('SHIPPED', 'DELIVERED')
      AND (${dateFilters[0]})
      AND (${dateFilters[1]})
      AND ${regionFilter}
  `);

  return processSalesRows(rawData.rows as any[]);
}

export async function getSummarySales(from: string, to: string, regionCode?: string) {
  let regionFilter = sql`1=1`;
  if (regionCode) {
    regionFilter = eq(dailySalesSummary.regionCode, regionCode);
  }

  const rawData = await db.execute(sql`
    SELECT 
      d.date as sale_date,
      d.region_code,
      d.product_id,
      d.units_sold as quantity,
      d.revenue_krw,
      d.cogs_krw,
      d.cargo_krw,
      d.order_count,
      p.name as product_name
    FROM daily_sales_summary d
    JOIN products p ON d.product_id = p.id
    WHERE d.date >= ${from}::date AND d.date <= ${to}::date
      AND ${regionFilter}
  `);

  return processSummaryRows(rawData.rows as any[]);
}

function processSalesRows(rows: any[]) {
  let totalRevenue = 0n;
  let totalCogs = 0n;
  let totalCargo = 0n;
  const uniqueOrders = new Set<string>();

  const byDate: Record<string, { date: string; KOR: bigint; UZB: bigint; total: bigint }> = {};
  const byProduct: Record<string, any> = {};

  for (const row of rows) {
    const qty = Number(row.quantity);
    const rev = BigInt(row.unit_price_snapshot || 0) * BigInt(qty);
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
    uniqueOrders.add(row.order_id);

    const dateStr = row.sale_date instanceof Date ? row.sale_date.toISOString().split('T')[0] : row.sale_date;
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

  return formatResponse(totalRevenue, totalCogs, totalCargo, uniqueOrders.size, byDate, byProduct);
}

function processSummaryRows(rows: any[]) {
  let totalRevenue = 0n;
  let totalCogs = 0n;
  let totalCargo = 0n;
  let totalOrders = 0;

  const byDate: Record<string, { date: string; KOR: bigint; UZB: bigint; total: bigint }> = {};
  const byProduct: Record<string, any> = {};

  for (const row of rows) {
    const rev = BigInt(row.revenue_krw || 0);
    const cogs = BigInt(row.cogs_krw || 0);
    const cargo = BigInt(row.cargo_krw || 0);
    const qty = Number(row.quantity || 0);
    const orders = Number(row.order_count || 0);

    totalRevenue += rev;
    totalCogs += cogs;
    totalCargo += cargo;
    totalOrders += orders; // Approximate total, summing distincts per product/region

    const dateStr = row.sale_date instanceof Date ? row.sale_date.toISOString().split('T')[0] : row.sale_date;
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

  return formatResponse(totalRevenue, totalCogs, totalCargo, totalOrders, byDate, byProduct);
}

function formatResponse(totalRevenue: bigint, totalCogs: bigint, totalCargo: bigint, orderCount: number, byDate: any, byProduct: any) {
  const marginStr = totalRevenue > 0n 
    ? (((Number(totalRevenue - totalCogs - totalCargo) / Number(totalRevenue)) * 100).toFixed(1) + '%') 
    : '0.0%';

  return {
    summary: {
      revenueKrw: totalRevenue.toString(),
      cogsKrw: totalCogs.toString(),
      cargoKrw: totalCargo.toString(),
      orderCount,
      grossMargin: marginStr,
    },
    byDate: Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)).map((d: any) => ({
      ...d,
      KOR: d.KOR.toString(),
      UZB: d.UZB.toString(),
      total: d.total.toString(),
    })),
    byProduct: Object.values(byProduct).map((p: any) => ({
      ...p,
      revenueKrw: p.revenueKrw.toString(),
      cogsKrw: p.cogsKrw.toString(),
      cargoKrw: p.cargoKrw.toString(),
      grossMargin: p.revenueKrw > 0n 
        ? (((Number(p.revenueKrw - p.cogsKrw - p.cargoKrw) / Number(p.revenueKrw)) * 100).toFixed(1) + '%') 
        : '0.0%',
    })).sort((a: any, b: any) => parseFloat(b.grossMargin) - parseFloat(a.grossMargin)),
  };
}
