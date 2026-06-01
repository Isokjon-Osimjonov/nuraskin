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

// Start BullMQ workers
import './modules/queues';

process.on('uncaughtException', err => {
  console.error('CRITICAL - Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', reason => {
  console.error('CRITICAL - Unhandled Rejection:', reason);
});

async function bootstrap() {
  // Run DB migrations on every startup
  try {
    await runMigrations();
    logger.info('Migrations complete');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap();
