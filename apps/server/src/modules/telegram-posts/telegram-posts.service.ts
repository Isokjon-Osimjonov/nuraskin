import * as repository from './telegram-posts.repository';
import * as storefrontRepository from '../storefront/storefront.repository';
import * as ordersRepository from '../orders/orders.repository';
import { customerBot as bot } from '../../common/services/telegram.service';
import { buildCaption } from './caption-builder.util';
import { NotFoundError, BadRequestError, ConflictError } from '../../common/errors/AppError';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { OpenAI } from 'openai';
import { telegramScheduleQueue } from '../queues/telegram-schedule.queue';
import type { CreateTelegramPostInput, UpdateTelegramPostInput } from '@nuraskin/shared-types';
import type { InputMediaPhoto } from 'grammy/types';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function createPost(input: CreateTelegramPostInput, adminId: string) {
  const { channelIds, ...postData } = input;
  return await repository.create(
    {
      ...postData,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      createdBy: adminId,
    } as any,
    channelIds
  );
}

export async function updatePost(id: string, input: UpdateTelegramPostInput) {
  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');
  if (post.status !== 'DRAFT') throw new ConflictError('Can only update DRAFT posts');

  const updateData: any = { ...input };
  if (input.scheduledAt !== undefined) {
    updateData.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  }

  return await repository.update(id, updateData);
}

export async function getPost(id: string) {
  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');
  return post;
}

export async function listPosts(filters: { status?: string; page: number; limit: number }) {
  return await repository.findAll(filters);
}

export async function generateCaption(productId: string, postType: string, language: string) {
  const product = await storefrontRepository.findProductById(productId);
  if (!product) throw new NotFoundError('Product not found');

  const postTypeInstructions: Record<string, string> = {
    PRODUCT_SHOWCASE: `This is a regular product showcase. Aspirational, confident hook. Example hook style: "Teringiz [natija] his qilsin" — focused on everyday quality.`,
    FLASH_SALE: `This is a TIME-LIMITED SALE post. The hook MUST explicitly convey urgency and a limited window — use real urgency words like "faqat bugun", "tezkor", "vaqt cheklangan", "shoshiling". Example hook style: "Faqat bugun — [mahsulot] maxsus narxda!" The body and bullets should also feel more energetic/exclamatory than a normal showcase. This MUST read distinctly more urgent than a regular post.`,
    NEW_ARRIVAL: `This is a NEW PRODUCT announcement. The hook MUST explicitly announce novelty — use words like "yangilik", "birinchi marta", "endi mavjud". Example hook style: "Yangilik! [mahsulot] endi mavjud."`,
    RESTOCK: `This is a RESTOCK announcement — product was sold out, now back. The hook MUST explicitly reference its return — use words like "yana mavjud", "qaytib keldi", "sog'inib qoldingizmi". Example hook style: "Sog'inib qoldingizmi? [mahsulot] yana mavjud!"`,
  };

  const postTypeHashtags: Record<string, string[]> = {
    PRODUCT_SHOWCASE: ['#goodskin', '#parvarish'],
    FLASH_SALE: ['#chegirma', '#aksiya', '#tezkortaklif'],
    NEW_ARRIVAL: ['#yangimahsulot', '#yangilik'],
    RESTOCK: ['#yanasotuvda', '#qaytdi'],
  };

  const systemPrompt = `${postTypeInstructions[postType] || ''}

You are a professional cosmetology copywriter for NuraSkin, a Korean cosmetics brand selling to Uzbekistan. Write persuasive, eye-catching Telegram post captions that make customers FEEL the transformation, not just read a product spec sheet.

Rules:
- Language: ${language === 'UZB' ? 'Uzbek (Latin script)' : 'Russian'}
- Tone: warm, trustworthy, sensory, benefit-focused.
- First line: one emotional hook (benefit-focused, NOT product name)
- Then: product name in CAPS on its own line
- Then: 2 short sentences describing how the product FEELS on skin and the RESULT it gives — focus on transformation and sensation, never a list of ingredients or specs
- Then: exactly 3 bullet specs using ✦ symbol
- CRITICAL RULE: each bullet must be 6 WORDS OR FEWER. Count the words. If a bullet exceeds 6 words, shorten it. Punchy, benefit-driven, zero filler words.
- NEVER mention weight, volume, ml, grams, "g", or any size/measurement of any kind — even if it appears in the product data below, IGNORE it completely. Customers care about results, not package size.
- Do NOT include pricing (added separately)
- Do NOT include links (added separately)
- Do NOT include stock count
- Max 8 lines total
- Return ONLY the caption body text, no markdown, no explanation`;

  const userPrompt = `Post type: ${postType}
Product: ${product.name}
Brand: ${product.brandName}
Description: ${product.descriptionUz}
Category: ${product.categoryName}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return { 
      caption: response.choices[0].message.content?.trim() || '',
      hashtags: postTypeHashtags[postType] || []
    };
  } catch (error) {
    logger.error(error, 'OpenAI generation failed');
    throw new BadRequestError('AI caption generation failed');
  }
}

export async function sendPost(id: string) {
  const testUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`;
  try {
    const res = await fetch(testUrl);
    const data = await res.json();
    logger.info({ botTest: data }, 'Telegram API test');
  } catch (err) {
    logger.error({ err }, 'Raw fetch to Telegram failed');
  }

  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');

  const product = post.productId
    ? await storefrontRepository.findProductById(post.productId)
    : { configs: [] };
  const rate = await ordersRepository.getLatestRateSnapshot();

  if (!rate) {
    throw new BadRequestError('No exchange rate configured');
  }

  let caption = buildCaption(post as any, product, rate);

  // Truncate based on content
  const hasImages = post.imageUrls && (post.imageUrls as string[]).length > 0;
  const maxLen = hasImages ? 1024 : 4096;

  if (caption.length > maxLen) {
    logger.warn({ postId: id, originalLength: caption.length }, 'Telegram caption truncated');
    caption = caption.substring(0, maxLen - 3) + '...';
  }

  const results = [];
  let overallSuccess = true;

  for (const channel of (post as any).channels) {
    try {
      let messageId: number;

      if (!hasImages) {
        const msg = await bot.api.sendMessage(channel.chatId, caption, { parse_mode: 'HTML' });
        messageId = msg.message_id;
      } else {
        const images = post.imageUrls as string[];
        if (images.length === 1) {
          const msg = await bot.api.sendPhoto(channel.chatId, images[0], {
            caption,
            parse_mode: 'HTML',
          });
          messageId = msg.message_id;
        } else {
          const mediaGroup: InputMediaPhoto[] = images.map((url, index) => ({
            type: 'photo',
            media: url,
            caption: index === 0 ? caption : undefined,
            parse_mode: index === 0 ? 'HTML' : undefined,
          }));
          const msgs = await bot.api.sendMediaGroup(channel.chatId, mediaGroup);
          messageId = msgs[0].message_id;
        }
      }

      await repository.updatePostChannel(id, channel.id, {
        status: 'SENT',
        messageId: BigInt(messageId),
        sentAt: new Date(),
      });
      results.push({ channelId: channel.id, success: true });
    } catch (error: any) {
      logger.error({ error, channelId: channel.id, postId: id }, 'Failed to send post to channel');
      await repository.updatePostChannel(id, channel.id, {
        status: 'FAILED',
      });
      results.push({ channelId: channel.id, success: false, error: error.message });
      overallSuccess = false;
    }
  }

  await repository.update(id, {
    status: overallSuccess ? 'SENT' : 'FAILED',
    sentAt: new Date(),
    errorMessage: overallSuccess ? null : 'One or more channels failed to receive the post',
  });

  return { success: overallSuccess, results };
}

export async function schedulePost(id: string, scheduledAt: Date) {
  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');

  await repository.update(id, {
    status: 'SCHEDULED',
    scheduledAt,
  });

  const delay = scheduledAt.getTime() - Date.now();
  await telegramScheduleQueue.add(
    'send-tg-post',
    { postId: id },
    { delay: Math.max(0, delay), jobId: `tg-post-${id}`, removeOnComplete: true }
  );
}

export async function cancelScheduled(id: string) {
  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');
  if (post.status !== 'SCHEDULED') throw new BadRequestError('Post is not scheduled');

  const job = await telegramScheduleQueue.getJob(`tg-post-${id}`);
  if (job) await job.remove();

  await repository.update(id, {
    status: 'DRAFT',
    scheduledAt: null,
  });
}

export async function removePost(id: string) {
  const post = await repository.findById(id);
  if (!post) throw new NotFoundError('Post not found');

  if (post.status === 'SCHEDULED') {
    const job = await telegramScheduleQueue.getJob(`tg-post-${id}`);
    if (job) await job.remove();
  }

  if (post.status === 'SENT') {
    for (const channel of post.channels) {
      if (channel.messageId) {
        try {
          await bot.api.deleteMessage(channel.chatId, Number(channel.messageId));
        } catch (err) {
          logger.warn({ err, channelId: channel.id }, 'Could not delete Telegram message');
        }
      }
    }
  }

  await repository.remove(id);
}
