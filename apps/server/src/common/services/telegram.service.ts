import { Bot } from 'grammy';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const customerBot = new Bot(env.TELEGRAM_BOT_TOKEN || 'dummy-token');

export const adminBot = new Bot(env.TELEGRAM_ADMIN_BOT_TOKEN || 'dummy-admin-token');

customerBot.catch(err => logger.error(err, 'Customer bot error'));
adminBot.catch(err => logger.error(err, 'Admin bot error'));

export async function sendToAdmin(message: string): Promise<void> {
  if (!env.TELEGRAM_ADMIN_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    logger.warn(
      'TELEGRAM_ADMIN_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set — admin notifications disabled'
    );
    return;
  }

  try {
    await Promise.allSettled([
      adminBot.api.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message, {
        parse_mode: 'HTML',
      }),
    ]);
  } catch (error) {
    logger.error({ error }, 'Failed to send admin Telegram message');
  }
}

export async function sendToCustomer(
  telegramId: number | string | bigint,
  message: string
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — customer notifications disabled');
    return;
  }

  try {
    await Promise.allSettled([
      customerBot.api.sendMessage(telegramId.toString(), message, {
        parse_mode: 'HTML',
      }),
    ]);
  } catch (error) {
    logger.error(
      { error, telegramId: telegramId.toString() },
      'Failed to send customer Telegram message'
    );
  }
}
