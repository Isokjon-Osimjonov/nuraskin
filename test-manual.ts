import { db, customers } from './libs/database/src';
import { createManualOrder } from './apps/server/src/modules/orders/orders.service';
import { eq } from 'drizzle-orm';

async function main() {
  const [customer] = await db.select().from(customers).limit(1);
  const result = await createManualOrder({
    customerId: customer.id,
    region: 'UZB',
    items: [
      { productId: 'c9a876d4-db63-480b-beef-5c8ff303108b', quantity: 1, negotiatedPriceKrw: 1000 }
    ],
    deliveryAddress: 'Test',
    deliveryFeeCoveredBy: 'CUSTOMER',
    deliveryFeeCharged: 0,
    deliveryFeeActual: 0,
    forceCreate: true
  }, '718e055f-af7f-40ac-93f4-3774fb724e62');
  console.log("Created:", result.id);
  process.exit(0);
}
main().catch(console.error);
