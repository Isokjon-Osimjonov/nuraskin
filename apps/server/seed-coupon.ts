import { db, coupons } from '@nuraskin/database';

async function seed() {
  await db.insert(coupons).values({
    code: 'TEST20',
    name: 'Test Coupon 20%',
    type: 'PERCENTAGE',
    value: 20n,
    status: 'ACTIVE',
    minOrderAmount: 0n,
    minOrderQty: 1,
    maxUsesPerCustomer: 1,
  });
  console.log('Test coupon created');
  process.exit(0);
}

seed();
