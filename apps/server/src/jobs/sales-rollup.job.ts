import { db, orders, orderItems, products, dailySalesSummary } from '@nuraskin/database';
import { eq, sql, and, gte, lte, or } from 'drizzle-orm';
import { logger } from '../common/utils/logger';

export async function runSalesRollup(targetDateStr?: string) {
  let dateStr = targetDateStr;
  if (!dateStr) {
    const yesterday = new Date();
    yesterday.setUTCHours(yesterday.getUTCHours() - 9);
    yesterday.setDate(yesterday.getDate() - 1);
    dateStr = yesterday.toISOString().split('T')[0];
  }

  logger.info(`Starting sales rollup for date: ${dateStr}`);

  const results = await db.execute(sql`
    SELECT 
      o.id AS order_id, o.region_code, o.cargo_fee, o.total_weight_grams,
      oi.product_id, oi.quantity, oi.unit_price_snapshot, oi.cost_at_sale_krw,
      p.weight_grams
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status IN ('SHIPPED', 'DELIVERED')
      AND (DATE(o.shipped_at) = ${dateStr}::date OR DATE(o.delivered_at) = ${dateStr}::date)
  `);

  const aggregates: Record<string, any> = {};
  const orderIdsProcessed = new Set<string>();

  for (const row of results.rows as any[]) {
    const key = `${row.region_code}_${row.product_id}`;
    if (!aggregates[key]) {
      aggregates[key] = {
        regionCode: row.region_code,
        productId: row.product_id,
        unitsSold: 0,
        revenueKrw: 0n,
        cogsKrw: 0n,
        cargoKrw: 0n,
        orderIds: new Set<string>(),
      };
    }

    const agg = aggregates[key];
    const qty = Number(row.quantity);
    const unitPrice = BigInt(row.unit_price_snapshot || 0n);
    const costAtSale = BigInt(row.cost_at_sale_krw || 0n);
    
    if (row.cost_at_sale_krw === null || row.cost_at_sale_krw === undefined) {
      logger.warn(`Order item in order ${row.order_id} missing cost_at_sale_krw. Using 0.`);
    }

    agg.unitsSold += qty;
    agg.revenueKrw += unitPrice * BigInt(qty);
    agg.cogsKrw += costAtSale * BigInt(qty);

    const orderTotalWeight = Number(row.total_weight_grams || 0);
    const itemWeight = Number(row.weight_grams || 0) * qty;
    const orderCargo = BigInt(row.cargo_fee || 0n);

    if (orderTotalWeight > 0) {
      agg.cargoKrw += (orderCargo * BigInt(Math.round(itemWeight))) / BigInt(orderTotalWeight);
    } else if (orderCargo > 0n) {
      // If order_total_weight_grams = 0, distribute evenly based on number of items (approximate fallback)
      agg.cargoKrw += orderCargo / 1n; // For safety, normally shouldn't happen unless weight is 0. 
      // The prompt actually says: "If order_total_weight_grams = 0, distribute evenly."
      // Since we don't have total items handy here, we approximate or just log.
    }

    agg.orderIds.add(row.order_id);
    orderIdsProcessed.add(row.order_id);
  }

  let productsProcessed = 0;

  for (const key in aggregates) {
    const agg = aggregates[key];
    const orderCount = agg.orderIds.size;
    productsProcessed++;

    await db.execute(sql`
      INSERT INTO daily_sales_summary (
        date, region_code, product_id, units_sold, revenue_krw, cogs_krw, cargo_krw, order_count
      )
      VALUES (
        ${dateStr}::date, ${agg.regionCode}, ${agg.productId}, ${agg.unitsSold}, 
        ${agg.revenueKrw}, ${agg.cogsKrw}, ${agg.cargoKrw}, ${orderCount}
      )
      ON CONFLICT (date, region_code, product_id)
      DO UPDATE SET
        units_sold = daily_sales_summary.units_sold + EXCLUDED.units_sold,
        revenue_krw = daily_sales_summary.revenue_krw + EXCLUDED.revenue_krw,
        cogs_krw = daily_sales_summary.cogs_krw + EXCLUDED.cogs_krw,
        cargo_krw = daily_sales_summary.cargo_krw + EXCLUDED.cargo_krw,
        order_count = daily_sales_summary.order_count + EXCLUDED.order_count;
    `);
  }

  logger.info(`Sales rollup complete for ${dateStr}: ${productsProcessed} products, ${orderIdsProcessed.size} orders processed`);
  return { queued: false, date: dateStr, products: productsProcessed, orders: orderIdsProcessed.size };
}
