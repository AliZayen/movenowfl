import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '@/app/lib/server/db';
import { Client, PASSWORD, plantOtp } from '../support/http';

const email = () => `e2e-${randomUUID()}@movenow.test`;

async function signUp(c: Client, address = email(), password = 'Sup3rSecret!') {
  const start = await c.post('/auth/signup', { email: address, password, fullName: 'E2E Person' });
  expect(start.status).toBe(202);
  const code = await plantOtp(address, 'signup');
  return { address, password, verify: await c.post('/auth/signup/verify', { email: address, code }) };
}

describe('sign-up with an email code', () => {
  it('creates nothing until the code is entered, then signs in', async () => {
    const c = new Client();
    const address = email();
    expect((await c.post('/auth/signup', { email: address, password: 'Sup3rSecret!', fullName: 'E2E Person' })).status).toBe(202);
    expect(await db.user.findUnique({ where: { email: address } })).toBeNull();
    expect(c.cookie).toBeNull();
    const code = await plantOtp(address, 'signup');
    const v = await c.post('/auth/signup/verify', { email: address, code });
    expect(v.status).toBe(201);
    expect(v.body.user).toMatchObject({ email: address, role: 'customer', emailVerified: true, fullName: 'E2E Person' });
    expect(c.cookie).not.toBeNull();
    expect((await c.get('/auth/session')).body.user.email).toBe(address);
  });

  it('the session cookie is HTTP-only and SameSite=Lax', async () => {
    const c = new Client();
    const address = email();
    await c.post('/auth/signup', { email: address, password: 'Sup3rSecret!' });
    const code = await plantOtp(address, 'signup');
    const res = await fetch(`${c.base}/api/v1/auth/signup/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': c.ip },
      body: JSON.stringify({ email: address, code }),
    });
    const cookie = res.headers.getSetCookie().find((x) => x.startsWith('mn_session='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
  });

  it('a wrong code is refused with the field error', async () => {
    const c = new Client();
    const address = email();
    await c.post('/auth/signup', { email: address, password: 'Sup3rSecret!' });
    const right = await plantOtp(address, 'signup');
    const res = await c.post('/auth/signup/verify', { email: address, code: right === '000000' ? '111111' : '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR', fields: { code: expect.any(String) } });
  });

  it("an email that already has an account can't sign up again", async () => {
    const res = await new Client().post('/auth/signup', { email: 'john.doe@movenow.test', password: 'Sup3rSecret!' });
    expect(res.status).toBe(409);
  });

  it('weak passwords are refused with field errors', async () => {
    const res = await new Client().post('/auth/signup', { email: email(), password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toBeTruthy();
  });
});

describe('sign-in and sessions', () => {
  it('signs in with the right password and out again', async () => {
    const c = new Client();
    const res = await c.signIn('john.doe@movenow.test');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: 'customer', email: 'john.doe@movenow.test' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect((await c.post('/auth/signout')).status).toBe(204);
    expect((await c.get('/auth/session')).status).toBe(401);
  });

  it('the same answer for a wrong password and an unknown email', async () => {
    const wrong = await new Client().signIn('john.doe@movenow.test', 'not-the-password1');
    const unknown = await new Client().signIn(email(), 'not-the-password1');
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('signed-out requests to private endpoints are 401 with the standard error shape', async () => {
    const res = await new Client().get('/bookings');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: expect.any(String) } });
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('a forged or stale cookie is not a session', async () => {
    const c = new Client();
    c.cookie = 'mn_session=not-a-real-token';
    expect((await c.get('/auth/session')).status).toBe(401);
  });

  it('an unconfirmed account gets EMAIL_NOT_VERIFIED with the right password only', async () => {
    const address = email();
    const passwordHash = (await db.user.findUniqueOrThrow({ where: { email: 'john.doe@movenow.test' } })).passwordHash;
    await db.user.create({ data: { email: address, fullName: 'Unverified', passwordHash, preferences: { create: {} } } });
    const right = await new Client().signIn(address, PASSWORD);
    expect(right.status).toBe(403);
    expect(right.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect((await new Client().signIn(address, 'wrong-password1')).status).toBe(401);
  });

  it('sign-in is rate limited per IP', async () => {
    const c = new Client();
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) codes.push((await c.signIn(email(), 'whatever-123')).status);
    expect(codes.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(codes[10]).toBe(429);
  });

  it('cross-site POSTs are blocked', async () => {
    const c = new Client();
    const res = await c.request('POST', '/auth/signin', { email: 'john.doe@movenow.test', password: PASSWORD }, { origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(c.cookie).toBeNull();
  });
});

describe('passwords', () => {
  it('change password keeps this session and signs out the others', async () => {
    const a = new Client();
    const { address, password } = await signUp(a);
    const b = new Client();
    expect((await b.signIn(address, password)).status).toBe(200);
    const res = await a.post('/auth/password/change', { currentPassword: password, newPassword: 'Ch4nged-pass' });
    expect(res.status).toBe(200);
    expect((await a.get('/auth/session')).status).toBe(200);
    expect((await b.get('/auth/session')).status).toBe(401);
    expect((await new Client().signIn(address, 'Ch4nged-pass')).status).toBe(200);
  });

  it('change password needs the current one', async () => {
    const a = new Client();
    await signUp(a);
    expect((await a.post('/auth/password/change', { currentPassword: 'wrong-pass1', newPassword: 'Another-pass1' })).status).toBe(400);
  });

  it('reset with a code sets the password and signs out everywhere', async () => {
    const a = new Client();
    const { address } = await signUp(a);
    const forgot = await new Client().post('/auth/password/forgot', { email: address });
    expect(forgot.status).toBe(200);
    const code = await plantOtp(address, 'password_reset');
    const reset = await new Client().post('/auth/password/reset', { email: address, code, newPassword: 'Res3t-password' });
    expect(reset.status).toBe(200);
    expect((await a.get('/auth/session')).status).toBe(401);
    expect((await new Client().signIn(address, 'Res3t-password')).status).toBe(200);
  });

  it('"forgot password" answers the same for unknown emails', async () => {
    const res = await new Client().post('/auth/password/forgot', { email: email() });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('staff and pro sign-in', () => {
  it('staff need a second step by email code, then get an admin session', async () => {
    const c = new Client();
    const first = await c.signIn('admin@movenow.test');
    expect(first.status).toBe(403);
    expect(first.body.error.code).toBe('MFA_REQUIRED');
    expect(c.cookie).toBeNull();
    const code = await plantOtp('admin@movenow.test', 'admin_login');
    const v = await c.post('/auth/signin/verify', { email: 'admin@movenow.test', code });
    expect(v.status).toBe(200);
    expect(v.body.user).toMatchObject({ role: 'admin', staffRole: 'manager' });
    expect(v.body.user.permissions).toContain('bookings.manage');
    expect((await c.get('/admin/me')).status).toBe(200);
    const audit = await db.auditLog.findFirst({ where: { action: 'staff.sign_in' }, orderBy: { createdAt: 'desc' } });
    expect(audit).not.toBeNull();
  });

  it('pros sign in with their own password, no second step', async () => {
    const c = new Client();
    const res = await c.signIn('mike.rodriguez@movenow.test');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: 'provider', staffRole: null, permissions: [] });
  });

  it("a pro whose provider profile is inactive can't sign in", async () => {
    const mike = await db.user.findUniqueOrThrow({ where: { email: 'mike.rodriguez@movenow.test' } });
    await db.provider.update({ where: { userId: mike.id }, data: { active: false } });
    try {
      const res = await new Client().signIn('mike.rodriguez@movenow.test');
      expect(res.status).toBe(403);
    } finally {
      await db.provider.update({ where: { userId: mike.id }, data: { active: true } });
    }
  });

  it('seeded pros without a password cannot sign in', async () => {
    expect((await new Client().signIn('james.brown@movenow.test')).status).toBe(401);
  });
});
