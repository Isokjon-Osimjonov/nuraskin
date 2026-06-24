import { createOrder, transitionOrderStatus, completePacking } from './apps/server/src/modules/orders/orders.service';
import { db, stockReservations, inventoryBatches } from '@nuraskin/database';
import { eq } from 'drizzle-orm';
import { updateOrderStatus } from './apps/server/src/modules/orders/orders.service';
import { worker as timeoutWorker } from './apps/server/src/modules/queues/reservation-timeout.queue';

async function main() {
  console.log('--- TEST 1: PAYMENT_SUBMITTED timeout ---');
  const order1 = await createOrder({
    customerId: 'aafbb668-b28b-457a-86c5-b47cc637e5a2', regionCode: 'UZB', currency: 'UZS',
    items: [{ productId: 'c9a876d4-db63-480b-beef-5c8ff303108b', quantity: 1 }],
    shippingAddress: { fullName: 'T1', phone: '+998901234567', addressLine1: 'A1', city: 'Tashkent', country: 'Uzbekistan' }
  } as any);
  await updateOrderStatus(order1.id, { to: 'PENDING_PAYMENT' }, '718e055f-af7f-40ac-93f4-3774fb724e62');
  await transitionOrderStatus(order1.id, 'PAYMENT_SUBMITTED', {});
  console.log(`Order 1 is PAYMENT_SUBMITTED. Running timeout worker job manually...`);
  await timeoutWorker.processJob({ data: { orderId: order1.id } } as any);
  let res1 = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order1.id));
  console.log(`O1 Reservations after timeout:`, res1.map(r => r.status));

  console.log('\n--- TEST 2: DRAFT straight to PAYMENT_CONFIRMED ---');
  const order2 = await createOrder({
    customerId: 'aafbb668-b28b-457a-86c5-b47cc637e5a2', regionCode: 'UZB', currency: 'UZS',
    items: [{ productId: 'c9a876d4-db63-480b-beef-5c8ff303108b', quantity: 1 }],
    shippingAddress: { fullName: 'T2', phone: '+998901234567', addressLine1: 'A2', city: 'Tashkent', country: 'Uzbekistan' }
  } as any);
  console.log(`Order 2 created as DRAFT. Transitioning to PAYMENT_CONFIRMED...`);
  await transitionOrderStatus(order2.id, 'PAYMENT_CONFIRMED', {});
  let res2 = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order2.id));
  console.log(`O2 Reservations after transition:`, res2.map(r => r.status));

  console.log('\n--- TEST 3: PAYMENT_CONFIRMED to REFUNDED ---');
  console.log(`Transitioning O2 to REFUNDED...`);
  await transitionOrderStatus(order2.id, 'REFUNDED', {});
  res2 = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order2.id));
  console.log(`O2 Reservations after REFUNDED:`, res2.map(r => r.status));

  console.log('\nDONE');
}

main().catch(console.error).then(() => process.exit(0));
