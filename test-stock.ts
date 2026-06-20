import { updateProduct } from './apps/server/src/modules/products/products.service';
import { getProduct } from './apps/server/src/modules/products/products.service';
import { createManualOrder } from './apps/server/src/modules/orders/orders.service';
import { db, products } from '@nuraskin/database';
import { eq } from 'drizzle-orm';

async function run() {
  const [prod] = await db.select().from(products).limit(1);
  console.log(`[TEST] Product: ${prod.name}`);
  console.log(`[TEST] Initial showStockCount: ${prod.showStockCount}`);

  console.log(`[TEST] Updating to true...`);
  await updateProduct(prod.id, { showStockCount: true });

  const [updated] = await db.select().from(products).where(eq(products.id, prod.id));
  console.log(`[TEST] After update showStockCount: ${updated.showStockCount}`);

  console.log(`[TEST] Simulating INSUFFICIENT_STOCK with true...`);
  try {
    await createManualOrder({
      customerId: 'some-customer',
      region: 'UZB',
      items: [{ productId: prod.id, quantity: 999999 }],
      deliveryAddress: 'test',
      deliveryFeeCharged: 0,
      deliveryFeeActual: 0,
      deliveryFeeCoveredBy: 'CUSTOMER'
    }, 'admin-123');
  } catch (err: any) {
    console.log(`[TEST] Error message (true): ${err.message}`);
  }

  console.log(`[TEST] Updating to false...`);
  await updateProduct(prod.id, { showStockCount: false });

  console.log(`[TEST] Simulating INSUFFICIENT_STOCK with false...`);
  try {
    await createManualOrder({
      customerId: 'some-customer',
      region: 'UZB',
      items: [{ productId: prod.id, quantity: 999999 }],
      deliveryAddress: 'test',
      deliveryFeeCharged: 0,
      deliveryFeeActual: 0,
      deliveryFeeCoveredBy: 'CUSTOMER'
    }, 'admin-123');
  } catch (err: any) {
    console.log(`[TEST] Error message (false): ${err.message}`);
  }

  process.exit(0);
}

run().catch(console.error);
