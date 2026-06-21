import axios from 'axios';
import { db } from '@nuraskin/database';

async function run() {
  const customer = await db.query.customers.findFirst({ where: (c, { eq }) => eq(c.phone, '+998901234567') });
  if (!customer) {
    console.log('No customer');
    process.exit(1);
  }
  const { listCoupons } = require('./apps/server/src/modules/storefront/storefront.service');
  const coupons = await listCoupons(customer.id, 'KOR');
  console.log(JSON.stringify(coupons, null, 2));
  process.exit(0);
}
run();
