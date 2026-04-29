import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import * as ordersService from './src/modules/orders/orders.service';

const serialize = (obj: any) => JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value, 2);

async function test() {
  try {
    // 1. Create Order
    const order = await ordersService.createOrder({
      customerId: '2065ee99-ecd8-4791-8745-162c0e10f110',
      regionCode: 'UZB',
      currency: 'UZS',
      adminNote: 'Test order creation script'
    });
    console.log('Order created:', serialize(order));

    // 2. Add Item (Relief Sun product)
    const item = await ordersService.addOrderItem(order.id, {
      productId: 'd8347e2f-fe21-4a12-8b07-8cf12026edfa',
      quantity: 2
    });
    console.log('Item added:', serialize(item));

    // 3. Get full order detail
    const detail = await ordersService.getOrderDetail(order.id);
    console.log('Full Order Detail:', serialize(detail));

  } catch (error) {
    console.error('Test error:', error);
  }
}

test().then(() => process.exit(0)).catch(console.error);
