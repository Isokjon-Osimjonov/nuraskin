import { Bot } from 'grammy';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';

if (!env.TELEGRAM_BOT_TOKEN) {
  logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram bot functionality will be disabled');
}

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN || 'dummy-token');

// Log bot errors
bot.catch((err) => {
  logger.error(err, 'Grammy bot error');
});
