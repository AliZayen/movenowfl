// Vitest globalSetup for the integration and e2e projects: recreate the test database, apply every
// migration (the same SQL production runs) and load the seed.
import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { ROOT, testDatabaseUrl, testEnv } from './test-db';

export async function resetTestDatabase() {
  const { url, name } = testDatabaseUrl();
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
  const env = { ...process.env, ...testEnv() };
  execSync('npx prisma migrate deploy', { cwd: ROOT, env, stdio: 'pipe' });
  execSync('npx tsx prisma/seed.ts', { cwd: ROOT, env, stdio: 'pipe' });
}

export default async function setup() {
  await resetTestDatabase();
}
