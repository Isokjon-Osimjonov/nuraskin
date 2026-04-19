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

import { app } from './app';
import { logger } from './common/utils/logger';
import { env } from './common/config/env';

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
