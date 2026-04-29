import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';

export const telegramChannels = pgTable('telegram_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  chatId: varchar('chat_id', { length: 100 }).notNull().unique(),
  chatType: varchar('chat_type', { length: 20 }).notNull(), // CHANNEL | GROUP
  language: varchar('language', { length: 5 }).notNull().default('UZB'),
  isActive: boolean('is_active').notNull().default(true),
  addedBy: uuid('added_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  chatIdIdx: uniqueIndex('telegram_channels_chat_id_idx').on(t.chatId),
}));

export const telegramPosts = pgTable('telegram_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id),
  postType: varchar('post_type', { length: 30 }).notNull().default('PRODUCT_SHOWCASE'),
  language: varchar('language', { length: 5 }).notNull().default('UZB'),
  captionText: text('caption_text').notNull().default(''),
  imageUrls: jsonb('image_urls').notNull().default('[]'),
  hashtags: jsonb('hashtags').notNull().default('[]'),
  showCta: boolean('show_cta').notNull().default(false),
  ctaText: varchar('cta_text', { length: 100 }),
  ctaUrl: text('cta_url'),
  showKrwRetail: boolean('show_krw_retail').notNull().default(false),
  showKrwWholesale: boolean('show_krw_wholesale').notNull().default(false),
  showUzsRetail: boolean('show_uzs_retail').notNull().default(false),
  showUzsWholesale: boolean('show_uzs_wholesale').notNull().default(false),
  showAdminPhone: boolean('show_admin_phone').notNull().default(false),
  adminPhone: varchar('admin_phone', { length: 20 }),
  link1Show: boolean('link1_show').notNull().default(false),
  link1Text: varchar('link1_text', { length: 50 }),
  link1Url: text('link1_url'),
  link2Show: boolean('link2_show').notNull().default(false),
  link2Text: varchar('link2_text', { length: 50 }),
  link2Url: text('link2_url'),
  link3Show: boolean('link3_show').notNull().default(false),
  link3Text: varchar('link3_text', { length: 50 }),
  link3Url: text('link3_url'),
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT | SCHEDULED | SENT | FAILED
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const telegramPostChannels = pgTable('telegram_post_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => telegramPosts.id, { onDelete: 'cascade' }),
  channelId: uuid('channel_id').notNull().references(() => telegramChannels.id, { onDelete: 'cascade' }),
  messageId: bigint('message_id', { mode: 'bigint' }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
}, (t) => ({
  postChannelIdx: uniqueIndex('telegram_post_channels_unique_idx').on(t.postId, t.channelId),
}));

// Relations
export const telegramChannelsRelations = relations(telegramChannels, ({ many, one }) => ({
  posts: many(telegramPostChannels),
  addedBy: one(users, {
    fields: [telegramChannels.addedBy],
    references: [users.id],
  }),
}));

export const telegramPostsRelations = relations(telegramPosts, ({ one, many }) => ({
  product: one(products, {
    fields: [telegramPosts.productId],
    references: [products.id],
  }),
  createdBy: one(users, {
    fields: [telegramPosts.createdBy],
    references: [users.id],
  }),
  channels: many(telegramPostChannels),
}));

export const telegramPostChannelsRelations = relations(telegramPostChannels, ({ one }) => ({
  post: one(telegramPosts, {
    fields: [telegramPostChannels.postId],
    references: [telegramPosts.id],
  }),
  channel: one(telegramChannels, {
    fields: [telegramPostChannels.channelId],
    references: [telegramChannels.id],
  }),
}));

export type TelegramChannel = typeof telegramChannels.$inferSelect;
export type NewTelegramChannel = typeof telegramChannels.$inferInsert;
export type TelegramPost = typeof telegramPosts.$inferSelect;
export type NewTelegramPost = typeof telegramPosts.$inferInsert;
export type TelegramPostChannel = typeof telegramPostChannels.$inferSelect;
export type NewTelegramPostChannel = typeof telegramPostChannels.$inferInsert;
