import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    displayName: 'shared-types',
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/libs/shared-types',
    },
  },
});
