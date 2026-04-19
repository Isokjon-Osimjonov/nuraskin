import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    displayName: 'server-e2e',
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    globalSetup: ['./src/support/global-setup.ts'],
    setupFiles: ['./src/support/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/server-e2e',
    },
  },
});
