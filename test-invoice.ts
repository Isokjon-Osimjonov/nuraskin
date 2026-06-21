import { generateInvoiceHtml } from './apps/server/src/modules/orders/invoice.service';

const html = generateInvoiceHtml({
  orderId: '123',
  orderNumber: 'TEST-123',
  createdAt: new Date(),
  deliveryAddress: 'Test Address',
  subtotal: 1000,
  cargoFee: 100,
  deliveryFeeCharged: 0,
  totalAmount: 1100,
  customerName: 'Test Customer',
  customerPhone: '123456',
  items: []
});

console.log(html);
