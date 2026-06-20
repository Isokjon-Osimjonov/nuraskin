import { resolve } from 'path';
import dotenv from 'dotenv';

// In development (Nx serve), NX_WORKSPACE_ROOT points to repo root.
// In production (compiled dist/), fall back to two levels up from __dirname.
const envPath = process.env['NX_WORKSPACE_ROOT']
  ? resolve(process.env['NX_WORKSPACE_ROOT'], '.env')
  : resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

// Validate env immediately after loading — crashes on invalid config.
import './common/config/env';

import { runMigrations } from '@nuraskin/database';
import { app } from './app';
import { logger } from './common/utils/logger';
import { env } from './common/config/env';
import * as Sentry from '@sentry/node';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
} else {
  logger.warn('SENTRY_DSN not set — error tracking disabled');
}

// Start BullMQ workers
import { worker as reservationWorker, telegramWorker, salesRollupWorker } from './modules/queues';

process.on('uncaughtException', err => {
  Sentry.captureException(err);
  console.error('CRITICAL - Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', reason => {
  Sentry.captureException(reason);
  console.error('CRITICAL - Unhandled Rejection:', reason);
});

async function bootstrap() {
  // Run DB migrations on every startup
  // NOTE: For a single-instance deploy, this is fine.
  // IF this ever scales to multiple server instances running simultaneously,
  // this exact pattern would need to change to a separate one-time migration step
  // BEFORE starting any instances, to avoid race conditions.
  try {
    await runMigrations();
    logger.info('Migrations complete');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      logger.info('Server closed');
      try {
        await Promise.all([
          reservationWorker.close(),
          telegramWorker.close(),
          salesRollupWorker.close()
        ]);
        logger.info('BullMQ workers closed');
      } catch (err) {
        logger.error({ err }, 'Error closing BullMQ workers');
      }
      process.exit(0);
    });
    // force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000);
  });
}

bootstrap();
