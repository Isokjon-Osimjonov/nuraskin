import { adminBot } from '../../../common/services/telegram.service';
import { env } from '../../../common/config/env';

export async function sendContactMessage(data: {
  name: string;
  phone: string;
  subject: string;
  message: string;
  region: string;
}) {
  const regionLabel = data.region === 'KOR' ? '🇰🇷 Koreya' : "🇺🇿 O'zbekiston";

  const text = [
    '📩 *Yangi aloqa xabari*',
    '',
    `👤 *Ism:* ${data.name}`,
    `📱 *Telefon:* ${data.phone}`,
    `🌍 *Mintaqa:* ${regionLabel}`,
    `📌 *Mavzu:* ${data.subject}`,
    '',
    `💬 *Xabar:*`,
    data.message,
    '',
    `🕐 ${new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
    })}`,
  ].join('\n');

  if (env.TELEGRAM_ADMIN_CHAT_ID) {
    await adminBot.api.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, text, { parse_mode: 'Markdown' });
  }

  return { success: true };
}
