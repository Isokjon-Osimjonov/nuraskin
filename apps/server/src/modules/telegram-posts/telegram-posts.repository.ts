import { db, telegramPosts, telegramPostChannels, telegramChannels, products } from '@nuraskin/database';
import { eq, and, sql, desc, isNull, inArray } from 'drizzle-orm';
import type { NewTelegramPost, TelegramPost, NewTelegramPostChannel } from '@nuraskin/database';

export async function create(postData: NewTelegramPost, channelIds: string[]) {
  return await db.transaction(async (tx) => {
    const payload = {
      ...postData,
      scheduledAt: postData.scheduledAt ? new Date(postData.scheduledAt as any) : null,
      sentAt: postData.sentAt ? new Date(postData.sentAt as any) : null,
    };
    
    const [post] = await tx.insert(telegramPosts).values(payload as any).returning();
    if (!post) throw new Error('Failed to create post');

    if (channelIds.length > 0) {
      const postChannels: NewTelegramPostChannel[] = channelIds.map(channelId => ({
        postId: post.id,
        channelId,
        status: 'PENDING',
      }));
      await tx.insert(telegramPostChannels).values(postChannels);
    }

    return post;
  });
}

export async function update(id: string, data: Partial<TelegramPost>) {
  const payload = {
    ...data,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt as any) : null,
    sentAt: data.sentAt ? new Date(data.sentAt as any) : null,
    updatedAt: new Date()
  };
  
  const [row] = await db.update(telegramPosts).set(payload as any).where(eq(telegramPosts.id, id)).returning();
  return row;
}

export async function findAll(filters: { status?: string; page: number; limit: number }) {
  const offset = (filters.page - 1) * filters.limit;
  const conditions = [];
  if (filters.status && filters.status !== 'ALL') {
    conditions.push(eq(telegramPosts.status, filters.status));
  }

  const data = await db
    .select({
      id: telegramPosts.id,
      postType: telegramPosts.postType,
      language: telegramPosts.language,
      status: telegramPosts.status,
      scheduledAt: telegramPosts.scheduledAt,
      sentAt: telegramPosts.sentAt,
      createdAt: telegramPosts.createdAt,
      productName: products.name,
    })
    .from(telegramPosts)
    .leftJoin(products, eq(telegramPosts.productId, products.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(telegramPosts.createdAt))
    .limit(filters.limit)
    .offset(offset);

  const [totalCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(telegramPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    data: data.map(r => ({
      ...r,
      scheduledAt: r.scheduledAt ? new Date(r.scheduledAt).toISOString() : null,
      sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    })),
    total: totalCount.count,
  };
}

export async function findPostStatus(id: string) {
  const [post] = await db.select({ status: telegramPosts.status }).from(telegramPosts).where(eq(telegramPosts.id, id)).limit(1);
  return post || null;
}

export async function findById(id: string) {
  const [post] = await db.select().from(telegramPosts).where(eq(telegramPosts.id, id)).limit(1);
  if (!post) return null;

  const channels = await db
    .select({
      id: telegramChannels.id,
      name: telegramChannels.name,
      chatId: telegramChannels.chatId,
      status: telegramPostChannels.status,
      messageId: telegramPostChannels.messageId,
      sentAt: telegramPostChannels.sentAt,
    })
    .from(telegramPostChannels)
    .innerJoin(telegramChannels, eq(telegramPostChannels.channelId, telegramChannels.id))
    .where(eq(telegramPostChannels.postId, id));

  return {
    ...post,
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : null,
    sentAt: post.sentAt ? new Date(post.sentAt).toISOString() : null,
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    channels: channels.map(c => ({
      ...c,
      sentAt: c.sentAt ? new Date(c.sentAt).toISOString() : null,
      messageId: c.messageId?.toString() || null,
    })),
  };
}

export async function updatePostChannel(postId: string, channelId: string, data: { status: string; messageId?: bigint; sentAt?: Date }) {
  await db
    .update(telegramPostChannels)
    .set(data)
    .where(and(eq(telegramPostChannels.postId, postId), eq(telegramPostChannels.channelId, channelId)));
}

export async function remove(id: string) {
  await db.delete(telegramPosts).where(eq(telegramPosts.id, id));
}
