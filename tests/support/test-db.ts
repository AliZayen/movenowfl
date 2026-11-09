// The test database: same Postgres server as DATABASE_URL in .env, but its own database
// (`<name>_test`), rebuilt from the migrations and the seed on every run. Dev data is never touched.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

export const ROOT = path.resolve(__dirname, '../..');

export function loadEnv(): Record<string, string> {
  const file = path.join(ROOT, '.env');
  return fs.existsSync(file) ? parse(fs.readFileSync(file)) : {};
}

/** TEST_DATABASE_URL if set, else DATABASE_URL with the database name suffixed `_test`. */
export function testDatabaseUrl() {
  const env = loadEnv();
  const explicit = process.env.TEST_DATABASE_URL ?? env.TEST_DATABASE_URL;
  const base = explicit ?? process.env.DATABASE_URL ?? env.DATABASE_URL;
  if (!base) throw new Error('Set DATABASE_URL (or TEST_DATABASE_URL) in .env to run the tests.');
  const url = new URL(base);
  if (!explicit) url.pathname = `${url.pathname.replace(/^\//, '').replace(/_test$/, '')}_test`;
  const name = url.pathname.replace(/^\//, '');
  // Safety net: the setup drops this database, so never point it at anything else.
  if (!name.endsWith('_test')) throw new Error(`Refusing to use "${name}" as the test database: its name must end in _test.`);
  return { url: url.toString(), name };
}

/** Env for the test process and anything it spawns: .env values, then the test database on top. */
export function testEnv(): Record<string, string> {
  const env = loadEnv();
  return {
    ...env,
    AUTH_SECRET: env.AUTH_SECRET ?? process.env.AUTH_SECRET ?? 'test-secret-that-is-at-least-32-characters-long',
    SEED_DEMO_PASSWORD: env.SEED_DEMO_PASSWORD ?? process.env.SEED_DEMO_PASSWORD ?? 'movenow-demo-123',
    DATABASE_URL: testDatabaseUrl().url,
    STORAGE_DIR: path.join(ROOT, 'storage', 'test'),
  };
}
