import { Queue, Worker } from 'bullmq';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import * as telegramPostsService from '../telegram-posts/telegram-posts.service';

export const telegramScheduleQueue = new Queue('telegram-schedule', {
  connection: {
    url: env.REDIS_URL,
  },
});

export const telegramWorker = new Worker(
  'telegram-schedule',
  async (job) => {
    const { postId } = job.data;
    logger.info({ postId }, 'Processing scheduled telegram post');
    await telegramPostsService.sendPost(postId);
  },
  {
    connection: {
      url: env.REDIS_URL,
    },
  }
);

telegramWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Telegram schedule job failed');
});
