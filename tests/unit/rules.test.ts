import { describe, expect, it } from 'vitest';
import { assertTransition } from '@/app/lib/server/lifecycle';
import { can, permissionsOf } from '@/app/lib/staff';
import { ApiError, clientIp, errors, isUuid, paginate } from '@/app/lib/server/http';
import { LIMITS, rateLimit } from '@/app/lib/server/rate-limit';
import { welcomeMessage } from '@/app/lib/server/booking-conversation';

describe('booking lifecycle', () => {
  const allowed: [string, string][] = [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['confirmed', 'pending'],
    ['confirmed', 'in_progress'],
    ['confirmed', 'cancelled'],
    ['in_progress', 'completed'],
    ['in_progress', 'cancelled'],
  ];
  it.each(allowed)('%s → %s is allowed', (from, to) => {
    expect(() => assertTransition(from as never, to as never)).not.toThrow();
  });

  const refused: [string, string][] = [
    ['pending', 'in_progress'],
    ['pending', 'completed'],
    ['completed', 'cancelled'],
    ['cancelled', 'pending'],
    ['in_progress', 'pending'],
  ];
  it.each(refused)('%s → %s is a 409', (from, to) => {
    expect(() => assertTransition(from as never, to as never)).toThrowError(expect.objectContaining({ status: 409, code: 'CONFLICT' }));
  });
});

describe('staff permissions', () => {
  it('managers can do everything', () => {
    expect(can({ role: 'admin', staffRole: 'manager' }, 'staff.manage')).toBe(true);
    expect(can({ role: 'admin', staffRole: 'manager' }, 'audit.view')).toBe(true);
  });
  it('dispatchers manage bookings but not staff or the support inbox', () => {
    const d = { role: 'admin', staffRole: 'dispatcher' as const };
    expect(can(d, 'bookings.manage')).toBe(true);
    expect(can(d, 'staff.manage')).toBe(false);
    expect(can(d, 'support.reply')).toBe(false);
  });
  it('support reads and replies but cannot manage bookings', () => {
    const s = { role: 'admin', staffRole: 'support' as const };
    expect(can(s, 'support.reply')).toBe(true);
    expect(can(s, 'bookings.manage')).toBe(false);
  });
  it('non-staff, disabled staff and staff without a role have no permissions', () => {
    expect(permissionsOf({ role: 'customer' })).toEqual([]);
    expect(permissionsOf({ role: 'provider' })).toEqual([]);
    expect(permissionsOf({ role: 'admin', staffRole: null })).toEqual([]);
    expect(permissionsOf({ role: 'admin', staffRole: 'manager', disabledAt: new Date() })).toEqual([]);
  });
});

describe('http helpers', () => {
  it('isUuid accepts UUIDs only', () => {
    expect(isUuid('2f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d')).toBe(true);
    expect(isUuid('MN-2026-0001')).toBe(false);
    expect(isUuid("1' OR '1'='1")).toBe(false);
  });
  it('paginate reports at least one page', () => {
    expect(paginate(1, 10, 0)).toEqual({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
    expect(paginate(2, 10, 21)).toMatchObject({ totalPages: 3 });
  });
  it('error helpers use the README §7.1 codes and statuses', () => {
    expect(errors.notFound('Booking')).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Booking not found' });
    expect(errors.unauthenticated()).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(errors.outOfArea('99999')).toMatchObject({ status: 422, code: 'OUT_OF_SERVICE_AREA' });
    const limited = errors.rateLimited(30);
    expect(limited).toBeInstanceOf(ApiError);
    expect(limited.headers).toEqual({ 'Retry-After': '30' });
  });
});

describe('client IP (rate limits and audit log)', () => {
  const req = (h: Record<string, string>) => ({ headers: new Headers(h) });

  it('takes the address our proxy appended, not what the client sent', () => {
    // The client claims 1.1.1.1; our one proxy appended the real address 203.0.113.9.
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }), 1)).toBe('203.0.113.9');
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }), 1)).toBe('203.0.113.9');
  });
  it('counts more proxies from the right', () => {
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9, 10.0.0.2' }), 2)).toBe('203.0.113.9');
  });
  it('falls back to X-Real-IP, then "unknown"', () => {
    expect(clientIp(req({ 'x-real-ip': '198.51.100.4' }), 1)).toBe('198.51.100.4');
    expect(clientIp(req({}), 1)).toBe('unknown');
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }), 2)).toBe('unknown'); // chain shorter than the proxies
  });
  it('ignores the headers entirely with no proxy in front', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' }), 0)).toBe('direct');
  });
});

describe('rate limiter', () => {
  it('allows `max` calls per window, then answers 429 with Retry-After', () => {
    const key = `unit-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    expect(() => rateLimit(key, 3, 60_000)).toThrowError(expect.objectContaining({ status: 429, code: 'RATE_LIMITED' }));
  });
  it('keys are independent', () => {
    const a = `unit-a-${Math.random()}`;
    rateLimit(a, 1, 60_000);
    expect(() => rateLimit(`unit-b-${Math.random()}`, 1, 60_000)).not.toThrow();
  });
  it('every limit is a positive count and window', () => {
    for (const [max, ms] of Object.values(LIMITS)) expect(max > 0 && ms > 0).toBe(true);
  });
});

describe('booking welcome message', () => {
  const booking = {
    id: 'x',
    ref: 'MN-2026-0042',
    customerId: 'c',
    serviceType: 'tv_mounting' as const,
    scheduledDate: new Date('2026-11-20T00:00:00Z'),
    preferredSlot: '14:00',
  };
  it('greets by first name and names the service, ref, date and time', () => {
    const text = welcomeMessage(booking, 'John Doe');
    expect(text).toContain('Hi John,');
    expect(text).toContain('TV Mounting');
    expect(text).toContain('MN-2026-0042');
    expect(text).toContain('Fri, Nov 20');
    expect(text).toContain('2:00 PM');
  });
  it('works without a name', () => {
    expect(welcomeMessage(booking, '  ')).toMatch(/^Hi, thanks/);
  });
});
