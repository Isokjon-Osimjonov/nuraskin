import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@nuraskin/database': resolve(__dirname, '../../libs/database/src/index.ts'),
      '@nuraskin/shared-types': resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@nuraskin/validation': resolve(__dirname, '../../libs/validation/src/index.ts'),
    },
  },
  test: {
    displayName: 'server',
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/server',
    },
  },
});
