import { Queue, Worker } from 'bullmq';
import { env } from '../../common/config/env';
import { logger } from '../../common/utils/logger';
import { runSalesRollup } from '../../jobs/sales-rollup.job';

export const salesRollupQueue = new Queue('sales-rollup', {
  connection: { url: env.REDIS_URL },
});

export const worker = new Worker(
  'sales-rollup',
  async (job) => {
    logger.info({ jobId: job.id }, 'Processing sales rollup job');
    const targetDate = job.data?.date;
    await runSalesRollup(targetDate);
  },
  { connection: { url: env.REDIS_URL } }
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Sales rollup job failed');
});

// Setup repeatable job
salesRollupQueue.add('nightly', {}, {
  repeat: { pattern: '0 15 * * *' },
  jobId: 'sales-rollup-nightly',
}).catch(err => {
  logger.error({ err }, 'Failed to schedule nightly sales rollup job');
});
