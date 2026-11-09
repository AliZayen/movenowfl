// HTTP helpers for the e2e tests: one client per person, each with its own session cookie and its
// own client IP (x-forwarded-for), so the per-IP rate limits of one test don't leak into another.
import { createHmac, randomInt } from 'node:crypto';
import { inject } from 'vitest';
import { db } from '@/app/lib/server/db';
import type { OtpPurpose } from '@/generated/prisma/client';

export const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'movenow-demo-123';

export interface Res<T = any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- response bodies are checked field by field
  status: number;
  body: T;
  headers: Headers;
}

export class Client {
  cookie: string | null = null;
  readonly ip = `10.${randomInt(255)}.${randomInt(255)}.${randomInt(1, 255)}`;
  constructor(readonly base = inject('baseUrl')) {}

  async request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Res> {
    const isForm = body instanceof FormData;
    // "/bookings" → API path; "/api/..." → as is; absolute URLs (pages, avatar links) → unchanged.
    const url = /^https?:/.test(path) ? path : `${this.base}${path.startsWith('/api') ? path : `/api/v1${path}`}`;
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      headers: {
        'x-forwarded-for': this.ip,
        ...(body !== undefined && !isForm ? { 'content-type': 'application/json' } : {}),
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
    for (const c of res.headers.getSetCookie()) {
      if (!c.startsWith('mn_session=')) continue;
      const value = c.split(';')[0];
      this.cookie = value === 'mn_session=' || /max-age=0|expires=thu, 01 jan 1970/i.test(c) ? null : value;
    }
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // HTML or binary: keep the text
    }
    return { status: res.status, body: parsed, headers: res.headers };
  }

  get = (path: string) => this.request('GET', path);
  post = (path: string, body: unknown = {}) => this.request('POST', path, body);
  patch = (path: string, body: unknown) => this.request('PATCH', path, body);
  del = (path: string, body?: unknown) => this.request('DELETE', path, body);
  /** A page (not the API), e.g. "/pro". */
  page = (path: string) => this.request('GET', `${this.base}${path}`); // absolute, so not under /api/v1

  async signIn(email: string, password = PASSWORD) {
    return this.post('/auth/signin', { email, password, remember: false });
  }

  /** Staff sign-in: password, then the emailed code (planted, since test emails aren't delivered). */
  async signInStaff(email: string, password = PASSWORD) {
    const first = await this.signIn(email, password);
    if (first.body?.error?.code !== 'MFA_REQUIRED') throw new Error(`Expected MFA_REQUIRED, got ${first.status}`);
    const code = await plantOtp(email, 'admin_login');
    return this.post('/auth/signin/verify', { email, code });
  }
}

/**
 * Replaces the newest code for this email + purpose with a known one, using the same HMAC the server
 * uses (both sides read AUTH_SECRET from the test env). Emails to .test addresses are never sent.
 */
export async function plantOtp(email: string, purpose: OtpPurpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const row = await db.otpCode.findFirst({ where: { email, purpose, usedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!row) throw new Error(`No ${purpose} code was issued for ${email}`);
  const codeHash = createHmac('sha256', process.env.AUTH_SECRET!).update(`${purpose}:${email}:${code}`).digest('hex');
  await db.otpCode.update({ where: { id: row.id }, data: { codeHash } });
  return code;
}

/** A small real PNG, made with sharp (the same library the server decodes uploads with). */
export async function makePng(width = 64, height = 48) {
  const sharp = (await import('sharp')).default;
  return sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } } }).png().toBuffer();
}

export function imageForm(data: Buffer, name = 'photo.png', type = 'image/png') {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(data)], { type }), name);
  return form;
}
