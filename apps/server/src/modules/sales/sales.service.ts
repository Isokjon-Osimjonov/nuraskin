import { db, orders, orderItems, products } from '@nuraskin/database';
import { eq, sql } from 'drizzle-orm';

export async function getLiveSales(from: string, to: string, regionCode?: string) {
  let regionFilter = sql`1=1`;
  if (regionCode) {
    regionFilter = eq(orders.regionCode, regionCode);
  }

  const rawData = await db.execute(sql`
    SELECT
      DATE(o.delivered_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as sale_date,
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
    WHERE o.status = 'DELIVERED'
      AND o.delivered_at IS NOT NULL
      AND o.delivered_at >= (${from}::text || ' 00:00:00+09')::timestamptz
      AND o.delivered_at <= (${to}::text || ' 23:59:59.999+09')::timestamptz
      AND ${regionFilter}
  `);

  return processSalesRows(rawData.rows as any[]);
}

export async function getSummarySales(from: string, to: string, regionCode?: string) {
  // Use the exact same logic as getLiveSales so we don't depend on the daily rollup job latency
  return getLiveSales(from, to, regionCode);
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
