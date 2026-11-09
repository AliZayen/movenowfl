import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/app/lib/server/db';
import { consumeOtp, issueOtp, OTP_MAX_ATTEMPTS, resendOtp } from '@/app/lib/server/otp';

// Capture the emails instead of printing them, so the tests can read the codes.
const sent: { to: string; subject: string; text: string }[] = [];
vi.mock('@/app/lib/server/email', () => ({
  sendEmail: vi.fn(async (e: { to: string; subject: string; text: string }) => void sent.push(e)),
  appUrl: (p: string) => `http://test${p}`,
}));

const codeFor = (email: string) => sent.filter((e) => e.to === email).at(-1)!.subject.slice(0, 6);
const newEmail = () => `otp-${randomUUID()}@movenow.test`;

beforeEach(() => {
  sent.length = 0;
});

describe('email codes', () => {
  it('emails a 6-digit code and stores only its hash', async () => {
    const email = newEmail();
    expect(await issueOtp({ email, purpose: 'signup' })).toBe(true);
    const code = codeFor(email);
    expect(code).toMatch(/^\d{6}$/);
    const row = await db.otpCode.findFirstOrThrow({ where: { email } });
    expect(row.codeHash).not.toContain(code);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('the right code works once', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'password_reset', payload: { hello: 'world' } });
    const row = await consumeOtp(email, 'password_reset', codeFor(email));
    expect(row.payload).toEqual({ hello: 'world' });
    await expect(consumeOtp(email, 'password_reset', codeFor(email))).rejects.toMatchObject({ status: 400 });
  });

  it('a code only works for its own purpose', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    await expect(consumeOtp(email, 'admin_login', codeFor(email))).rejects.toMatchObject({ status: 400 });
  });

  it(`stops after ${OTP_MAX_ATTEMPTS} wrong tries, even for the right code`, async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    const right = codeFor(email);
    const wrong = right === '000000' ? '111111' : '000000';
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) await expect(consumeOtp(email, 'signup', wrong)).rejects.toMatchObject({ status: 400 });
    await expect(consumeOtp(email, 'signup', right)).rejects.toMatchObject({ message: 'Too many wrong tries. Request a new code.' });
  });

  it('says how many tries are left', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    const wrong = codeFor(email) === '000000' ? '111111' : '000000';
    await expect(consumeOtp(email, 'signup', wrong)).rejects.toMatchObject({ message: "That code isn't right. 4 tries left." });
  });

  it('expired codes are refused', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    await db.otpCode.updateMany({ where: { email }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(consumeOtp(email, 'signup', codeFor(email))).rejects.toMatchObject({ status: 400 });
  });

  it('within 60 seconds a resend sends nothing and keeps the same code', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    expect(await resendOtp(email, 'signup')).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it('after the wait a new code replaces the old one', async () => {
    const email = newEmail();
    await issueOtp({ email, purpose: 'signup' });
    const first = codeFor(email);
    await db.otpCode.updateMany({ where: { email }, data: { createdAt: new Date(Date.now() - 61_000) } });
    expect(await resendOtp(email, 'signup')).toBe(true);
    const second = codeFor(email);
    if (first !== second) await expect(consumeOtp(email, 'signup', first)).rejects.toMatchObject({ status: 400 });
    expect(await db.otpCode.count({ where: { email } })).toBe(1);
  });

  it('resend does nothing if no code was ever requested', async () => {
    expect(await resendOtp(newEmail(), 'signup')).toBe(false);
    expect(sent).toHaveLength(0);
  });
});
