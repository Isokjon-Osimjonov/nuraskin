import { createOrder, transitionOrderStatus, completePacking } from './apps/server/src/modules/orders/orders.service';
import { db } from './libs/database/src/db';
import { stockReservations } from './libs/database/src/schema/inventory';
import { eq } from 'drizzle-orm';
import { updateOrderStatus } from './apps/server/src/modules/orders/orders.service';

async function main() {
  console.log('Creating order...');
  const order = await createOrder({
    customerId: null, // guest
    regionCode: 'UZB',
    currency: 'UZS',
    items: [
      {
        productId: 'e83df338-860f-4679-a906-f24cce5e2123',
        quantity: 1,
      }
    ],
    shippingAddress: {
      fullName: 'Test User',
      phone: '+998901234567',
      addressLine1: 'Test Address',
      city: 'Tashkent',
      country: 'Uzbekistan'
    }
  } as any);

  console.log(`Order created: ${order.id}`);
  console.log(`Current status: ${order.status}`);

  console.log('Transitioning to PENDING_PAYMENT...');
  // updateOrderStatus handles DRAFT -> PENDING_PAYMENT properly and reserves stock
  await updateOrderStatus(order.id, { to: 'PENDING_PAYMENT' }, 'admin-test');
  
  let res = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order.id));
  console.log(`Reservations after PENDING_PAYMENT:`, res.map(r => ({ id: r.id, status: r.status })));

  console.log('Transitioning to PAYMENT_CONFIRMED...');
  await updateOrderStatus(order.id, { to: 'PAYMENT_CONFIRMED' }, 'admin-test');
  
  res = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order.id));
  console.log(`Reservations after PAYMENT_CONFIRMED:`, res.map(r => ({ id: r.id, status: r.status })));

  console.log('Running completePacking...');
  await updateOrderStatus(order.id, { to: 'PACKING' }, 'admin-test');
  await completePacking(order.id, 'admin-test');
  
  res = await db.select().from(stockReservations).where(eq(stockReservations.orderId, order.id));
  console.log(`Reservations after PACKING:`, res.map(r => ({ id: r.id, status: r.status })));

  console.log('Canceling order to clean up...');
  await updateOrderStatus(order.id, { to: 'CANCELED' }, 'admin-test');
  
  console.log('DONE');
}

main().catch(console.error).then(() => process.exit(0));
