import { describe, expect, it } from 'vitest';
import { zEmail, zIsoDate, zPassword, zPhone, zZip } from '@/app/lib/validation/common';
import { adminConfirmSchema, createBookingSchema, listBookingsQuery } from '@/app/lib/validation/booking';
import { sendMessageSchema, updateConversationSchema, MESSAGE_MAX_LENGTH } from '@/app/lib/validation/messaging';
import { signUpSchema } from '@/app/lib/validation/auth';

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => schema.safeParse(v).success;

describe('common fields', () => {
  it('normalizes US phone numbers to E.164', () => {
    expect(zPhone.parse('(305) 555-0123')).toBe('+13055550123');
    expect(zPhone.parse('1 305 555 0123')).toBe('+13055550123');
    expect(zPhone.parse('+44 20 7946 0958')).toBe('+442079460958');
    expect(ok(zPhone, '12345')).toBe(false);
  });
  it('lower-cases and trims email', () => {
    expect(zEmail.parse('  John.Doe@MoveNow.TEST ')).toBe('john.doe@movenow.test');
    expect(ok(zEmail, 'not-an-email')).toBe(false);
  });
  it('requires 8–72 chars with a letter and a number in passwords', () => {
    expect(ok(zPassword, 'abc12345')).toBe(true);
    expect(ok(zPassword, 'short1')).toBe(false);
    expect(ok(zPassword, 'lettersonly')).toBe(false);
    expect(ok(zPassword, '1234567890')).toBe(false);
    expect(ok(zPassword, `a1${'x'.repeat(71)}`)).toBe(false);
  });
  it('checks dates and ZIPs', () => {
    expect(ok(zIsoDate, '2026-11-20')).toBe(true);
    expect(ok(zIsoDate, '11/20/2026')).toBe(false);
    expect(ok(zIsoDate, '2026-13-40')).toBe(false);
    expect(ok(zZip, '33139')).toBe(true);
    expect(ok(zZip, '3313')).toBe(false);
  });
});

describe('booking requests', () => {
  const loc = { street: '1 Main St', city: 'Miami', zip: '33139' };
  const tv = {
    serviceType: 'tv_mounting',
    scheduledDate: '2026-12-01',
    preferredSlot: '10:00',
    origin: loc,
    details: { mountType: 'wall', tvSize: '56_65', wallType: 'drywall_wood', bracket: 'tilting' },
  };

  it('accepts a valid request and fills defaults', () => {
    const parsed = createBookingSchema.parse(tv);
    expect(parsed.origin.state).toBe('FL');
    expect(parsed.details).toMatchObject({ tvCount: 1, needsPowerOutlet: false });
  });
  it('checks details with the schema for that service', () => {
    expect(ok(createBookingSchema, { ...tv, details: { homeSize: '1br', volume: 'full' } })).toBe(false);
  });
  it('requires a destination for moves', () => {
    const move = { ...tv, serviceType: 'moving', details: { homeSize: '1br', volume: 'full' } };
    expect(ok(createBookingSchema, move)).toBe(false);
    expect(ok(createBookingSchema, { ...move, destination: { ...loc, zip: '33131' } })).toBe(true);
  });
  it('only offers the published slots', () => {
    expect(ok(createBookingSchema, { ...tv, preferredSlot: '07:00' })).toBe(false);
    expect(ok(createBookingSchema, { ...tv, preferredSlot: '20:00' })).toBe(false);
  });
  it('admin confirm needs the window end after the start', () => {
    const id = '2f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
    expect(ok(adminConfirmSchema, { providerId: id, windowStart: '08:00', windowEnd: '10:00' })).toBe(true);
    expect(ok(adminConfirmSchema, { providerId: id, windowStart: '10:00', windowEnd: '08:00' })).toBe(false);
  });
  it('coerces and limits list paging', () => {
    expect(listBookingsQuery.parse({ page: '2', pageSize: '5' })).toMatchObject({ page: 2, pageSize: 5 });
    expect(ok(listBookingsQuery, { pageSize: '500' })).toBe(false);
  });
});

describe('messages and accounts', () => {
  it('trims messages and enforces 1–2000 characters', () => {
    expect(sendMessageSchema.parse({ body: '  hi  ' }).body).toBe('hi');
    expect(ok(sendMessageSchema, { body: '   ' })).toBe(false);
    expect(ok(sendMessageSchema, { body: 'x'.repeat(MESSAGE_MAX_LENGTH + 1) })).toBe(false);
  });
  it('closing a conversation takes a boolean', () => {
    expect(ok(updateConversationSchema, { closed: true })).toBe(true);
    expect(ok(updateConversationSchema, { closed: 'yes' })).toBe(false);
  });
  it('sign-up checks the password rules', () => {
    expect(ok(signUpSchema, { email: 'a@b.test', password: 'weak', fullName: 'A B' })).toBe(false);
  });
});
