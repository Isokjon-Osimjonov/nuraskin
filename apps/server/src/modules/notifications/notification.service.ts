import { logger } from '../../common/utils/logger';
import { sendToAdmin, sendToCustomer } from '../../common/services/telegram.service';
import { formatPrice } from '@nuraskin/shared-types';
import { db, settings as settingsTable } from '@nuraskin/database';

export const NotificationService = {
  async sendToCustomer(telegramId: string | bigint, message: string) {
    try {
      await sendToCustomer(telegramId, message);
    } catch (err) {
      logger.error({ err, telegramId }, 'Failed to send Telegram notification to customer');
    }
  },

  async sendToAdmin(message: string) {
    try {
      await sendToAdmin(message);
    } catch (err) {
      logger.error({ err }, 'Failed to send Telegram notification to admin');
    }
  },

  async sendOrderPlaced(
    order: { id: string; orderNumber: string; totalAmount: string | bigint | number; regionCode: string; cargoFee: string | bigint | number },
    items: { name: string; qty: number; subtotal: string | bigint | number }[],
    customerTelegramId: string | bigint
  ) {
    if (!customerTelegramId) return;

    try {
      const [settings] = await db.select().from(settingsTable).limit(1);
      const regionCode = order.regionCode as 'UZB' | 'KOR';
      const dateStr = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let itemsText = '';
      for (const item of items) {
        itemsText += `- ${item.name} x${item.qty} — ${formatPrice(item.subtotal, regionCode)}\n`;
      }

      let paymentInfoText = '';
      if (regionCode === 'KOR') {
        if (settings.korBankEnabled) {
          paymentInfoText += `🏦 Bank: ${settings.korBankName}\n👤 Egasi: ${settings.korBankHolder}\n💳 Raqam: ${settings.korBankNumber}\n`;
        }
        if (settings.korE9payEnabled) {
          paymentInfoText += `📱 E9 Pay: ${settings.korE9payName} — ${settings.korE9payAccount}\n`;
        }
      } else {
        if (settings.uzbBankEnabled) {
          paymentInfoText += `🏦 Bank: ${settings.uzbBankName}\n👤 Egasi: ${settings.uzbBankHolder}\n💳 Raqam: ${settings.uzbBankNumber}\n`;
        }
        if (settings.uzbE9payEnabled) {
          paymentInfoText += `📱 E9 Pay: ${settings.uzbE9payName} — ${settings.uzbE9payAccount}\n`;
        }
      }

      const text = `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
        `📦 #${order.orderNumber}\n` +
        `📅 ${dateStr}\n\n` +
        `Mahsulotlar:\n${itemsText}\n` +
        `💰 Jami: ${formatPrice(order.totalAmount, regionCode)}\n` +
        (Number(order.cargoFee) > 0 ? `🚚 Yetkazib berish: ${formatPrice(order.cargoFee, regionCode)}\n` : '') +
        `\n💳 To'lov ma'lumotlari:\n${paymentInfoText}\n` +
        `To'lovdan so'ng kvitansiyani yuboring.\n` +
        `🔗 https://nuraskin.uz/orders/${order.id}`;

      await this.sendToCustomer(customerTelegramId, text);
    } catch (err) {
      logger.error({ err, orderId: order.id }, 'Failed to send order placed notification');
    }
  },

  async sendPaymentSubmitted(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `📨 <b>Kvitansiyangiz qabul qilindi!</b>\n\n` +
      `📦 #${orderNumber}\n\n` +
      `✅ Kvitansiya adminga yuborildi.\n` +
      `Tekshirilgandan so'ng xabar beramiz.\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendPaymentVerified(orderId: string, orderNumber: string, total: string | bigint | number, regionCode: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const region = regionCode as 'UZB' | 'KOR';
    const text = `✅ <b>To'lovingiz tasdiqlandi!</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `💰 ${formatPrice(total, region)}\n\n` +
      `🎁 Buyurtmangiz tayyorlanmoqda.\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendOrderShipped(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `📦 <b>Buyurtmangiz yo'lda!</b>\n\n` +
      `#${orderNumber}\n\n` +
      `🚚 Buyurtmangiz jo'natildi.\n` +
      `Tez orada yetib boradi!\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendOrderDelivered(orderId: string, orderNumber: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const text = `🎉 <b>Buyurtmangiz yetkazildi!</b>\n\n` +
      `#${orderNumber}\n\n` +
      `✅ Buyurtmangiz muvaffaqiyatli yetkazildi.\n` +
      `Xaridingiz uchun rahmat! 🌸\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendOrderCancelled(orderId: string, orderNumber: string, total: string | bigint | number, regionCode: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const region = regionCode as 'UZB' | 'KOR';
    const text = `❌ <b>Buyurtmangiz bekor qilindi.</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `💰 ${formatPrice(total, region)}\n\n` +
      `Savollar bo'lsa murojaat qiling.\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendAdminNewOrder(orderId: string, orderNumber: string, total: string | bigint | number, region: string, customerName: string, itemCount: number) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `🛒 <b>Yangi buyurtma!</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `🌍 ${region}\n` +
      `💰 ${formatPrice(total, regionCode)}\n` +
      `📦 ${itemCount} ta mahsulot\n\n` +
      `🔗 https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendAdminPaymentSubmitted(orderId: string, orderNumber: string, total: string | bigint | number, customerName: string, region: string) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `📸 <b>Yangi kvitansiya!</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `💰 ${formatPrice(total, regionCode)}\n\n` +
      `Tasdiqlash uchun:\n` +
      `🔗 https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendAdminCancelled(orderId: string, orderNumber: string, total: string | bigint | number, customerName: string, region: string) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `❌ <b>Buyurtma bekor qilindi!</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `💰 ${formatPrice(total, regionCode)}\n\n` +
      `🔗 https://management.nuraskin.uz/orders/${orderId}`;
    await this.sendToAdmin(text);
  },

  async sendManualOrderCreated(orderId: string, orderNumber: string, total: string | bigint | number, region: string, adminName: string, customerTelegramId: string | bigint) {
    if (!customerTelegramId) return;
    const regionCode = region as 'UZB' | 'KOR';
    const [settings] = await db.select().from(settingsTable).limit(1);
    
    let paymentInfoText = '';
    if (regionCode === 'KOR') {
      if (settings.korBankEnabled) {
        paymentInfoText += `🏦 Bank: ${settings.korBankName}\n👤 Egasi: ${settings.korBankHolder}\n💳 Raqam: ${settings.korBankNumber}\n`;
      }
      if (settings.korE9payEnabled) {
        paymentInfoText += `📱 E9 Pay: ${settings.korE9payName} — ${settings.korE9payAccount}\n`;
      }
    } else {
      if (settings.uzbBankEnabled) {
        paymentInfoText += `🏦 Bank: ${settings.uzbBankName}\n👤 Egasi: ${settings.uzbBankHolder}\n💳 Raqam: ${settings.uzbBankNumber}\n`;
      }
      if (settings.uzbE9payEnabled) {
        paymentInfoText += `📱 E9 Pay: ${settings.uzbE9payName} — ${settings.uzbE9payAccount}\n`;
      }
    }

    const text = `📦 <b>Sizga buyurtma yaratildi!</b>\n\n` +
      `#${orderNumber}\n` +
      `Admin tomonidan: ${adminName}\n` +
      `💰 Jami: ${formatPrice(total, regionCode)}\n\n` +
      `To'lov ma'lumotlari:\n${paymentInfoText}\n` +
      `To'lovni amalga oshiring va kvitansiyani yuboring.\n` +
      `🔗 https://nuraskin.uz/orders/${orderId}`;
    await this.sendToCustomer(customerTelegramId, text);
  },

  async sendAdminManualOrderCreated(orderId: string, orderNumber: string, total: string | bigint | number, region: string, customerName: string, adminName: string) {
    const regionCode = region as 'UZB' | 'KOR';
    const text = `🛒 <b>Yangi MANUAL buyurtma</b>\n\n` +
      `📦 #${orderNumber}\n` +
      `👤 ${customerName}\n` +
      `💰 ${formatPrice(total, regionCode)}\n` +
      `🌍 ${region}\n` +
      `👨‍💼 Yaratdi: ${adminName}\n\n` +
      `🔗 https://management.nuraskin.uz/orders/${orderId}`;
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

  async sendPaymentTimeout(order: { id: string, orderNumber: string, regionCode: string, totalAmount: string | bigint | number }, customer: { telegramId?: string | bigint | null }) {
    if (!customer.telegramId) return;
    const region = order.regionCode as 'UZB' | 'KOR';
    const text = `⏰ <b>To'lov muddati tugadi</b>\n\n` +
      `📦 #${order.orderNumber}\n` +
      `Siz belgilangan vaqt ichida to'lov qilmadingiz. Buyurtmangiz avtomatik bekor qilindi.\n\n` +
      `🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${order.id}`;
    await this.sendToCustomer(customer.telegramId, text);
  },

  async sendAdminOrderTimeout(order: { orderNumber: string, regionCode: string, totalAmount: string | bigint | number, id: string }, customer: { fullName: string }) {
    const region = order.regionCode as 'UZB' | 'KOR';
    const text = `⏰ <b>TO'LOV TIMEOUT</b>\n\n` +
      `👤 Mijoz: ${customer.fullName}\n` +
      `📦 #${order.orderNumber}\n` +
      `💰 Summa: ${formatPrice(order.totalAmount, region)}\n` +
      `To'lov muddati tugadi. Buyurtma avtomatik bekor qilindi.\n` +
      `🔗 Boshqaruv: https://management.nuraskin.uz/orders/${order.id}`;
    await this.sendToAdmin(text);
  },
};
