import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { testEnv } from './tests/support/test-db';

// Three layers (README "Tests"):
//   unit         pure logic, no database
//   integration  server modules against a fresh `<db>_test` database (rebuilt every run)
//   e2e          a real `next start` server on its own port, also on the test database
const alias = { '@': path.resolve(__dirname) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          env: testEnv(),
          globalSetup: ['tests/support/setup-db.ts'],
          setupFiles: ['tests/support/quiet-email.ts'],
          // One shared database, and time slots are global per date: run the files one at a time.
          fileParallelism: false,
          maxWorkers: 1,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          environment: 'node',
          env: testEnv(),
          globalSetup: ['tests/support/setup-server.ts'],
          fileParallelism: false,
          maxWorkers: 1,
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
