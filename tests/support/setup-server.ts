// Vitest globalSetup for the e2e project: fresh test database, a production build (skip with
// E2E_SKIP_BUILD=1 when .next is already built), then `next start` on its own port with the test
// database. Set E2E_BASE_URL to test an already-running server instead (it must use the test database).
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { TestProject } from 'vitest/node';
import { resetTestDatabase } from './setup-db';
import { ROOT, testEnv } from './test-db';

const PORT = Number(process.env.E2E_PORT ?? 3100);
let server: ChildProcess | undefined;

function build(env: NodeJS.ProcessEnv) {
  try {
    execSync('npx next build', { cwd: ROOT, env, stdio: 'pipe' });
  } catch (e) {
    // Next can stop a build once to show an upgrade notice; the same command then continues.
    const out = `${(e as { stdout?: Buffer }).stdout ?? ''}${(e as { stderr?: Buffer }).stderr ?? ''}`;
    if (!out.includes('Retry the same command')) throw new Error(`next build failed:\n${out.slice(-4000)}`);
    execSync('npx next build', { cwd: ROOT, env, stdio: 'pipe' });
  }
}

async function waitForHealth(baseUrl: string, timeoutMs = 90_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Test server did not answer on ${baseUrl}/api/health`);
}

export default async function setup(project: TestProject) {
  await resetTestDatabase();
  let baseUrl = process.env.E2E_BASE_URL;
  if (!baseUrl) {
    const base = testEnv();
    // Production refuses to "send" without SMTP configured. Tests only use .test addresses, which are
    // never sent, so a placeholder host is enough when none is set.
    const env = { ...process.env, ...base, SMTP_HOST: base.SMTP_HOST || 'smtp.invalid', NODE_ENV: 'production' as const, PORT: String(PORT) };
    if (process.env.E2E_SKIP_BUILD !== '1' || !fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) build(env);
    const log = fs.openSync(path.join(ROOT, 'storage', 'test-server.log'), 'w');
    server = spawn('npx', ['next', 'start', '-p', String(PORT)], { cwd: ROOT, env, stdio: ['ignore', log, log], shell: true, detached: process.platform !== 'win32' });
    baseUrl = `http://localhost:${PORT}`;
  }
  try {
    await waitForHealth(baseUrl);
  } catch (e) {
    stopServer();
    throw e;
  }
  project.provide('baseUrl', baseUrl);
  return stopServer; // Vitest calls the returned function as the teardown
}

function stopServer() {
  if (!server?.pid) return;
  try {
    // The server runs under a shell (npx), so stop the whole process tree.
    if (process.platform === 'win32') execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: 'ignore' });
    else process.kill(-server.pid, 'SIGTERM');
  } catch {
    // already gone
  }
  server = undefined;
}

declare module 'vitest' {
  export interface ProvidedContext {
    baseUrl: string;
  }
}
