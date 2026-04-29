import { z } from 'zod';

export const telegramChatTypeSchema = z.enum(['CHANNEL', 'GROUP']);
export type TelegramChatType = z.infer<typeof telegramChatTypeSchema>;

export const telegramPostTypeSchema = z.enum(['PRODUCT_SHOWCASE', 'FLASH_SALE', 'NEW_ARRIVAL', 'RESTOCK']);
export type TelegramPostType = z.infer<typeof telegramPostTypeSchema>;

export const telegramCtaTypeSchema = z.enum(['BUY_NOW', 'DM_US', 'VISIT_WEB', 'CUSTOM']);
export type TelegramCtaType = z.infer<typeof telegramCtaTypeSchema>;

export const telegramPostStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'FAILED']);
export type TelegramPostStatus = z.infer<typeof telegramPostStatusSchema>;

export const telegramChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  chatId: z.string().min(1).max(100),
  chatType: telegramChatTypeSchema,
  language: z.string().min(2).max(5),
  isActive: z.boolean(),
  addedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TelegramChannelResponse = z.infer<typeof telegramChannelSchema>;

export const createTelegramChannelSchema = telegramChannelSchema.pick({
  name: true,
  chatId: true,
  chatType: true,
  language: true,
});

export type CreateTelegramChannelInput = z.infer<typeof createTelegramChannelSchema>;

export const telegramPostSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  postType: telegramPostTypeSchema,
  language: z.string().min(2).max(5),
  captionText: z.string(),
  imageUrls: z.array(z.string()),
  hashtags: z.array(z.string()),
  showKrwRetail: z.boolean(),
  showKrwWholesale: z.boolean(),
  showUzsRetail: z.boolean(),
  showUzsWholesale: z.boolean(),
  showCta: z.boolean(),
  ctaText: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  showAdminPhone: z.boolean(),
  adminPhone: z.string().nullable(),
  link1Show: z.boolean(),
  link1Text: z.string().nullable(),
  link1Url: z.string().nullable(),
  link2Show: z.boolean(),
  link2Text: z.string().nullable(),
  link2Url: z.string().nullable(),
  link3Show: z.boolean(),
  link3Text: z.string().nullable(),
  link3Url: z.string().nullable(),
  status: telegramPostStatusSchema,
  scheduledAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TelegramPostResponse = z.infer<typeof telegramPostSchema>;

export const createTelegramPostSchema = telegramPostSchema.omit({
  id: true,
  status: true,
  sentAt: true,
  errorMessage: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  channelIds: z.array(z.string().uuid()).min(1),
  scheduledAt: z.string().datetime().optional(),
});

export type CreateTelegramPostInput = z.infer<typeof createTelegramPostSchema>;

export const updateTelegramPostSchema = createTelegramPostSchema.partial().omit({ channelIds: true });
export type UpdateTelegramPostInput = z.infer<typeof updateTelegramPostSchema>;

export const telegramPostChannelSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  channelId: z.string().uuid(),
  messageId: z.string().nullable(), // BigInt as string
  status: z.enum(['PENDING', 'SENT', 'FAILED']),
  sentAt: z.string().nullable(),
});

export type TelegramPostChannelResponse = z.infer<typeof telegramPostChannelSchema>;
