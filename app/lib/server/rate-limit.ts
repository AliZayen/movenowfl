import { errors } from '@/app/lib/server/http';

// Fixed-window limiter kept in memory. Fine for one server instance; move to Redis/Upstash
// before running several instances (each would otherwise keep its own counts).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) sweep(now);
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) throw errors.rateLimited(Math.ceil((bucket.resetAt - now) / 1000));
}

function sweep(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

const MIN = 60_000;
export const LIMITS = {
  signIn: [10, 15 * MIN],
  signUp: [5, 60 * MIN],
  passwordEmail: [5, 60 * MIN], // any request that emails a code
  upload: [60, 60 * MIN], // photo uploads per user
  otpVerify: [20, 15 * MIN], // code checks per IP (each code also dies after 5 wrong tries)
  passwordChange: [10, 15 * MIN],
  createBooking: [20, 60 * MIN],
  estimate: [60, 15 * MIN],
  sendMessage: [60, 10 * MIN],
} as const satisfies Record<string, readonly [number, number]>;
