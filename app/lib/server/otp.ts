import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/app/lib/server/db';
import { sendEmail } from '@/app/lib/server/email';
import { ApiError, errors } from '@/app/lib/server/http';
import type { OtpPurpose, Prisma } from '@/generated/prisma/client';

// 6-digit email codes for sign-up and password reset.
// - Only an HMAC of the code is stored (keyed by AUTH_SECRET, bound to email + purpose).
// - Only the newest unused code per email + purpose works; issuing one deletes the older ones.
// - A code expires after 10 minutes and dies after 5 wrong tries.
// - A new code can be sent every 60 seconds. Inside that window the request quietly does nothing,
//   so the response never reveals whether an email has an account.

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60_000;
export const OTP_RESEND_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;

const INVALID = 'That code is invalid or has expired. Request a new one.';

function hashCode(purpose: OtpPurpose, email: string, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set to a random string of 32+ characters');
  return createHmac('sha256', secret).update(`${purpose}:${email}:${code}`).digest('hex');
}

const latestCode = (email: string, purpose: OtpPurpose) =>
  db.otpCode.findFirst({ where: { email, purpose, usedAt: null }, orderBy: { createdAt: 'desc' } });

interface IssueInput {
  email: string;
  purpose: OtpPurpose;
  userId?: string | null;
  /** Pending sign-up data. On a resend, the previous code's payload is kept when this is omitted. */
  payload?: Prisma.InputJsonValue;
}

/** Creates and emails a new code. Returns false (and sends nothing) during the resend cooldown. */
export async function issueOtp({ email, purpose, userId, payload }: IssueInput) {
  const previous = await latestCode(email, purpose);
  if (previous && Date.now() - previous.createdAt.getTime() < OTP_RESEND_MS) {
    // Same code still on its way: keep it, but use the latest sign-up details (e.g. a corrected password).
    if (payload !== undefined) await db.otpCode.update({ where: { id: previous.id }, data: { payload } });
    return false;
  }

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  const [, created] = await db.$transaction([
    db.otpCode.deleteMany({ where: { email, purpose } }), // older and already-used codes
    db.otpCode.create({
      data: {
        email,
        purpose,
        codeHash: hashCode(purpose, email, code),
        userId: userId ?? previous?.userId ?? null,
        payload: payload ?? (previous?.payload as Prisma.InputJsonValue | undefined) ?? undefined,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);
  try {
    await sendEmail(otpEmail(email, purpose, code));
  } catch {
    // The code never arrived: lift the 60-second wait so "resend" works right away. The row (and a
    // pending sign-up's details) stays; nobody knows this code, so it's harmless.
    await db.otpCode.update({ where: { id: created.id }, data: { createdAt: new Date(0) } });
    throw new ApiError(503, 'EMAIL_NOT_SENT', "We couldn't send the email right now. Please try again in a minute.");
  }
  return true;
}

/** "Resend code": only if a code was requested before (expired is fine). Keeps its user and payload. */
export async function resendOtp(email: string, purpose: OtpPurpose) {
  if (!(await latestCode(email, purpose))) return false;
  return issueOtp({ email, purpose });
}

/** What the client needs to show the code step. Same shape whether or not an email was sent. */
export const otpStep = (email: string) => ({
  email,
  codeLength: OTP_LENGTH,
  expiresInSec: OTP_TTL_MS / 1000,
  resendInSec: OTP_RESEND_MS / 1000,
});

/**
 * Checks the code and marks it used. Returns the row (userId, payload). Wrong codes count toward
 * the attempt limit; the count is bumped before comparing, so parallel guesses can't exceed it.
 */
export async function consumeOtp(email: string, purpose: OtpPurpose, code: string) {
  const row = await latestCode(email, purpose);
  const now = new Date();
  if (!row || row.expiresAt <= now) throw errors.validation(INVALID, { code: INVALID });

  const { count } = await db.otpCode.updateMany({
    where: { id: row.id, usedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (count === 0) {
    const msg = 'Too many wrong tries. Request a new code.';
    throw errors.validation(msg, { code: msg });
  }

  const expected = Buffer.from(row.codeHash, 'hex');
  const actual = Buffer.from(hashCode(purpose, email, code), 'hex');
  if (!timingSafeEqual(expected, actual)) {
    const left = OTP_MAX_ATTEMPTS - (row.attempts + 1);
    const msg = left > 0 ? `That code isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Request a new code.';
    throw errors.validation(msg, { code: msg });
  }

  const used = await db.otpCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: now } });
  if (used.count === 0) throw errors.validation(INVALID, { code: INVALID });
  return row;
}

function otpEmail(to: string, purpose: OtpPurpose, code: string) {
  const minutes = OTP_TTL_MS / 60_000;
  if (purpose === 'admin_login') {
    return {
      to,
      subject: `${code} is your MoveNow staff sign-in code`,
      text: `Your staff sign-in code is ${code}. It expires in ${minutes} minutes.

If you didn't just try to sign in, someone may know your password: reset it and tell your manager.`,
    };
  }
  if (purpose === 'password_reset') {
    return {
      to,
      subject: `${code} is your MoveNow password reset code`,
      text: `Your password reset code is ${code}.\n\nEnter it on the reset page to choose a new password. It expires in ${minutes} minutes.\n\nIf you didn't ask for this, you can ignore this email. Your password won't change.`,
    };
  }
  return {
    to,
    subject: `${code} is your MoveNow verification code`,
    text: `Welcome to MoveNow! Your verification code is ${code}.\n\nEnter it to confirm your email and finish creating your account. It expires in ${minutes} minutes.\n\nIf you didn't sign up, you can ignore this email.`,
  };
}
