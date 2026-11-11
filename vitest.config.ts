import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      AUTH_SECRET: 'test-secret-at-least-32-characters-long-key',
      SHEETS_WEBHOOK_SECRET: 'test-sheets-webhook-secret-32-characters-long',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
