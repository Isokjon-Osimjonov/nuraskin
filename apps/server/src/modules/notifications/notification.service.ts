import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { bot } from './bot';

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

const formatPrice = (val: string | bigint | number) =>
  (Number(BigInt(val)) / 100).toLocaleString('uz-UZ');

async function sendMessage(chatId: string, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — notifications disabled');
    return;
  }

  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    logger.error({ error, chatId }, 'Error sending Telegram message');
  }
}

export const NotificationService = {
  async sendToCustomer(telegramId: string | bigint, message: string) {
    await sendMessage(telegramId.toString(), message);
  },

  async sendToAdmin(message: string) {
    if (!env.TELEGRAM_ADMIN_CHAT_ID) {
      logger.warn('TELEGRAM_ADMIN_CHAT_ID not set — admin notifications disabled');
      return;
    }
    await sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message);
  },

  async sendOrderPlaced(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `🛍️ <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount)} ${order.currency}\n\n` +
      `To'lov qilish uchun profilingizga o'ting.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendReceiptSubmitted(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `✅ <b>Chekingiz yuborildi!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `Admin tekshirib, tez orada tasdiqlaydi.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendReceiptRejected(order: OrderSummary, customer: CustomerSummary, reason: string) {
    if (!customer.telegramId) return;
    const text = `⚠️ <b>To'lovingiz rad etildi</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `❌ Sabab: ${reason}\n\n` +
      `Iltimos, to'lovni qayta amalga oshiring va chekni yuboring.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendReceiptApproved(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `✅ <b>To'lovingiz tasdiqlandi!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `📦 Buyurtmangiz tayyorlanmoqda...`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendPackingComplete(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `📦 <b>Buyurtmangiz jo'natishga tayyor!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `Tez orada jo'natiladi.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendShipped(order: OrderSummary, customer: CustomerSummary, trackingNumber: string | null) {
    if (!customer.telegramId) return;
    const text = `🚀 <b>Buyurtmangiz jo'natildi!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `📬 Tracking: ${trackingNumber || "Mavjud emas"}\n\n` +
      `Yetkazib berish 7-14 ish kunini oladi.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendDelivered(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `🎉 <b>Buyurtmangiz yetkazildi!</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `NuraSkin'ni tanlaganingiz uchun rahmat! 💕`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendCancelled(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `❌ <b>Buyurtmangiz bekor qilindi</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendPaymentTimeout(order: OrderSummary, customer: CustomerSummary) {
    if (!customer.telegramId) return;
    const text = `⏰ <b>To'lov muddati tugadi</b>\n\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `Siz belgilangan vaqt ichida to'lov qilmadingiz.\n` +
      `Buyurtmangiz avtomatik bekor qilindi.\n\n` +
      `Qaytadan buyurtma bera olasiz.`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendAdminNewOrder(order: OrderSummary, customer: CustomerSummary) {
    const text = `🆕 <b>YANGI BUYURTMA</b>\n\n` +
      `👤 Mijoz: ${customer.fullName}\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount)} ${order.currency}\n` +
      `🌍 Mintaqa: ${order.regionCode}`;
    await this.sendToAdmin(text);
  },

  async sendAdminReceiptReceived(order: OrderSummary, customer: CustomerSummary) {
    const text = `💳 <b>TO'LOV CHEKI KELDI</b>\n\n` +
      `👤 Mijoz: ${customer.fullName}\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount)} ${order.currency}\n\n` +
      `Admin paneldan tasdiqlang yoki rad eting.`;
    await this.sendToAdmin(text);
  },

  async sendAdminOrderTimeout(order: OrderSummary, customer: CustomerSummary) {
    const text = `⏰ <b>TO'LOV TIMEOUT</b>\n\n` +
      `👤 Mijoz: ${customer.fullName}\n` +
      `📋 Buyurtma: ${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount)} ${order.currency}\n` +
      `To'lov muddati tugadi. Buyurtma avtomatik bekor qilindi.`;
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
      `Hoziroq buyurtma bering: <a href="https://nuraskin.uz/products/${product.barcode}">Sotib olish</a>`;
    await this.sendToCustomer(customer.telegramId, text);
  },
};
