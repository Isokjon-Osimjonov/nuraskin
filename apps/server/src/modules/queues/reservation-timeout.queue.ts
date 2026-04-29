import { Queue, Worker } from 'bullmq';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { db, orders, stockReservations, orderStatusHistory, customers, settings, stockMovements } from '@nuraskin/database';
import { eq, and, sql } from 'drizzle-orm';
import * as ordersRepository from '../orders/orders.repository';
import * as customersRepository from '../customers/customers.repository';
import { NotificationService } from '../notifications/notification.service';

export const reservationTimeoutQueue = new Queue(
  'reservation-timeout',
  { connection: { url: env.REDIS_URL } }
);

export const worker = new Worker(
  'reservation-timeout',
  async (job) => {
    const { orderId } = job.data;
    logger.info({ orderId }, 'Processing reservation timeout job');
    
    // 1. Check order is still PENDING_PAYMENT
    const order = await ordersRepository.findById(orderId);
    if (!order || order.status !== 'PENDING_PAYMENT') {
      logger.info({ orderId, status: order?.status }, 'Order not pending payment, skipping timeout');
      return; // Already paid or cancelled — do nothing
    }

    const [settingsRow] = await db.select().from(settings).limit(1);
    
    await db.transaction(async (tx) => {
      // 2. Release all ACTIVE reservations and restore physical stock
      await ordersRepository.releaseOrderReservations(orderId, tx);
      
      // 4. Cancel the order
      await tx.update(orders)
        .set({ status: 'CANCELED', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      
      // 5. Write order_status_history
      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'CANCELED',
        note: `To'lov muddati tugadi (${settingsRow?.paymentTimeoutMinutes || 30} daqiqa)`,
      });
    });
    
    // 6. Notify customer
    const customer = await customersRepository.findById(order.customerId);
    if (customer?.telegramId) {
      await NotificationService.sendPaymentTimeout(order as any, customer as any);
    }
    
    // 7. Notify admin
    await NotificationService.sendAdminOrderTimeout(order as any, customer as any);
  },
  { connection: { url: env.REDIS_URL } }
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Reservation timeout job failed');
});
