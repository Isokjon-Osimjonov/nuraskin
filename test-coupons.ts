import { db } from '@nuraskin/database';
import { listCoupons } from './apps/server/src/modules/storefront/storefront.service';

async function run() {
  const customer = await db.query.customers.findFirst();
  const coupons = await listCoupons(customer.id, 'KOR');
  console.log(coupons);
  process.exit(0);
}
run();
