import { updateProduct } from './apps/server/src/modules/products/products.service';
import { createManualOrder } from './apps/server/src/modules/orders/orders.service';
import { db, products } from '@nuraskin/database';
import { eq } from 'drizzle-orm';

async function run() {
  const [prod] = await db.select().from(products).limit(1);

  await updateProduct(prod.id, { showStockCount: true });
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
    console.log(`[TEST] True config -> message: "${err.message}", code: "${err.code}"`);
  }

  await updateProduct(prod.id, { showStockCount: false });
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
    console.log(`[TEST] False config -> message: "${err.message}", code: "${err.code}"`);
  }

  process.exit(0);
}

run().catch(console.error);
