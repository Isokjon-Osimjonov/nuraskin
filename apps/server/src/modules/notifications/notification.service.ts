import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { sendToAdmin, sendToCustomer } from '../../common/services/telegram.service';
import { formatPrice, formatKrw, formatUzs } from '@nuraskin/shared-types';

interface OrderSummary {
  orderNumber: string;
  totalAmount: string | bigint | number;
  currency: string;
  regionCode: string;
}

interface CustomerSummary {
  fullName: string;
  telegramId?: string | bigint | null;
}

export const NotificationService = {
  async sendToCustomer(telegramId: string | bigint, message: string) {
    await sendToCustomer(telegramId, message);
  },

  async sendToAdmin(message: string) {
    await sendToAdmin(message);
  },

  async sendOrderPlaced(orderId: string, orderNumber: string, total: string | bigint | number, items: { name: string; qty: number; subtotal: string | bigint | number }[], cargoFee: string | bigint | number, customerTelegramId: string | bigint, regionCode: 'UZB' | 'KOR') {
    if (!customerTelegramId) return;
    const dateStr = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    let itemsText = '';
    for (const item of items) {
      itemsText += `• ${item.name} x${item.qty} — ${formatPrice(item.subtotal, regionCode)}\n`;
    }
    const text = `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
      `📦 Buyurtma: #${orderNumber}\n` +
      `📅 Sana: ${dateStr}\n\n` +
      `Mahsulotlar:\n${itemsText}\n` +
      `💰 Jami: ${formatPrice(total, regionCode)}\n` +
      `🚚 Yetkazib berish: ${formatPrice(cargoFee, regionCode)}\n\n` +
      `To'lovni amalga oshiring va kvitansiyani yuboring.\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendPaymentSubmitted(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `📨 <b>Kvitansiyangiz qabul qilindi</b>\n` +
      `📦 #${orderNumber}\n` +
      `⏳ Admin tomonidan tekshirilmoqda...\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendPaymentVerified(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `✅ <b>To'lovingiz tasdiqlandi!</b>\n` +
      `📦 #${orderNumber}\n` +
      `🎁 Buyurtmangiz tayyorlanmoqda.\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendPacking(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `📦 <b>Buyurtmangiz tayyorlanmoqda</b>\n` +
      `#${orderNumber}\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendShipped(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `🚚 <b>Buyurtmangiz jo'natildi!</b>\n` +
      `📦 #${orderNumber}\n` +
      `🏠 Yetkazib berish vaqti: 3-5 kun\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendDelivered(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `🎉 <b>Buyurtmangiz yetkazildi!</b>\n` +
      `📦 #${orderNumber}\n` +
      `Xaridingiz uchun rahmat! 🌸\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendCancelled(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `❌ <b>Buyurtmangiz bekor qilindi</b>\n` +
      `📦 #${orderNumber}\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendPaymentTimeout(order: OrderSummary & { id: string }, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const region = order.regionCode as 'UZB' | 'KOR';
    const text = `⏰ <b>To'lov muddati tugadi</b>\n\n` +
      `📦 #${order.orderNumber}\n` +
      `Siz belgilangan vaqt ichida to'lov qilmadingiz. Buyurtmangiz avtomatik bekor qilindi.\n\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${order.id}`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendAdminOrderTimeout(order: OrderSummary & { id: string }, customer: CustomerSummary) {
    const region = order.regionCode as 'UZB' | 'KOR';
    const text = `⏰ <b>TO'LOV TIMEOUT</b>\n\n` +
      `👤 Mijoz: ${customer.fullName}\n` +
      `📦 #${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount, region)}\n` +
      `To'lov muddati tugadi. Buyurtma avtomatik bekor qilindi.\n` +
      `🔗 Boshqaruv: https://management.nuraskin.uz/orders/${order.id}`;
    await this.sendToAdmin(text);
  },

  async sendAdminNewOrder(orderId: string, orderNumber: string, total: string | bigint | number, region: string, customerName: string) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `🛒 <b>Yangi buyurtma!</b>\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `💰 ${formatPrice(total, regionCode)}\n` +
      `🌍 ${region}\n` +
      `🔗 Boshqaruv: https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendAdminPaymentSubmitted(orderId: string, orderNumber: string, total: string | bigint | number, customerName: string, region: string) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `💳 <b>To'lov kvitansiyasi yuborildi</b>\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `💰 ${formatPrice(total, regionCode)}\n` +
      `🔗 Boshqaruv: https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendAdminCancelled(orderId: string, orderNumber: string, customerName: string) {
    const text = `❌ <b>Buyurtma bekor qilindi</b>\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `🔗 Boshqaruv: https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendAdminLowStock(productName: string, remaining: number) {
    const text = `⚠️ <b>KAM QOLDIQ OGOHLANTIRISH</b>\n\n` +
      `📦 Mahsulot: ${productName}\n` +
      `🔢 Qoldi: ${remaining} ta\n\n` +
      `Yangi partiya buyurtma qiling.`;
    await this.sendToAdmin(text);
  },

  async sendRestockNotification(product: { name: string; barcode: string }, customer: { telegramId: string | bigint }) {
    if (!customer.telegramId) return;
    const text = `🔔 <b>Xushxabar!</b>\n\n` +
      `📦 <b>${product.name}</b> yana mavjud bo'ldi.\n\n` +
      `🔗 Mahsulotni ko'rish: https://nuraskin.uz/products/${product.barcode}`;
    await this.sendToCustomer(customer.telegramId, text);
  },
};

