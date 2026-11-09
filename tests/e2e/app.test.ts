import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/app/lib/server/db';
import { addDays, todayInFlorida } from '@/app/lib/server/time';
import { Client, imageForm, makePng } from '../support/http';

const john = new Client();
const admin = new Client();
const mike = new Client();
let providerIds: Record<string, string> = {};

beforeAll(async () => {
  expect((await john.signIn('john.doe@movenow.test')).status).toBe(200);
  expect((await admin.signInStaff('admin@movenow.test')).status).toBe(200);
  expect((await mike.signIn('mike.rodriguez@movenow.test')).status).toBe(200);
  providerIds = Object.fromEntries((await db.provider.findMany()).map((p) => [p.displayName, p.id]));
});

/** A free slot for `service` with `hours` free hours in a row, found through the public API. */
async function freeSlot(service = 'moving', hours = 3, fromDay = 5) {
  for (let d = fromDay; d < 85; d++) {
    const date = addDays(todayInFlorida(), d);
    const { body } = await john.get(`/availability?service=${service}&zip=33139&date=${date}`);
    const slots = body.slots as { time: string; available: boolean }[];
    for (let i = 0; i + hours <= slots.length; i++) if (slots.slice(i, i + hours).every((s) => s.available)) return { date, slot: slots[i].time };
  }
  throw new Error('no free slot');
}

const loc = (street: string, zip = '33139') => ({ street, city: 'Miami Beach', state: 'FL', zip, floor: 'ground', elevator: true, parking: 'street' });
const moveBody = (when: { date: string; slot: string }) => ({
  serviceType: 'moving',
  scheduledDate: when.date,
  preferredSlot: when.slot,
  origin: loc('10 E2E Origin St'),
  destination: loc('20 E2E Destination Ave', '33131'),
  details: { homeSize: '1br', volume: 'full', specialItems: [] },
});

describe('public catalog', () => {
  it('lists services, areas and pros, and checks ZIPs', async () => {
    const c = new Client();
    const services = await c.get('/services');
    expect(services.status).toBe(200);
    expect((services.body.items ?? services.body.services ?? services.body).length ?? Object.keys(services.body).length).toBeTruthy();
    expect((await c.get('/service-areas/check?zip=33139')).body).toMatchObject({ served: true });
    expect((await c.get('/service-areas/check?zip=90210')).body).toMatchObject({ served: false, area: null });
    expect((await c.get('/service-areas/check?zip=abc')).status).toBe(400);
    const pros = await c.get('/providers?service=tv_mounting&zip=33139');
    expect(pros.body.items.map((p: { name: string }) => p.name).sort()).toEqual(['Alex Wilson', 'David Kim', 'Leo Martinez']);
  });

  it('estimates a price without signing in', async () => {
    const when = await freeSlot();
    const res = await new Client().post('/quotes/estimate', moveBody(when));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ quotedPriceCents: 21000, estimatedDurationMin: 180, area: expect.any(String) });
  });

  it('returns 12 slots for a date', async () => {
    const res = await new Client().get(`/availability?service=moving&zip=33139&date=${addDays(todayInFlorida(), 20)}`);
    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(12);
  });
});

describe('a booking from request to moderated conversation', () => {
  let bookingId = '';
  let ref = '';
  let conversationId = '';

  it('the customer books; the booking comes with a support conversation and a welcome message', async () => {
    const res = await john.post('/bookings', moveBody(await freeSlot()));
    expect(res.status).toBe(201);
    ({ id: bookingId, ref } = res.body.booking);
    const conv = await john.post('/conversations', { bookingId });
    expect(conv.status).toBe(200); // already existed
    conversationId = conv.body.conversation.id;
    expect(conv.body.conversation).toMatchObject({ seat: 'customer', moderator: null, otherParty: { kind: 'support' } });
    const msgs = await john.get(`/conversations/${conversationId}/messages`);
    expect(msgs.body.items).toHaveLength(1);
    expect(msgs.body.items[0]).toMatchObject({ automated: true, sender: { kind: 'support' } });
    expect(msgs.body.items[0].body).toContain(ref);
  });

  it('the customer reads it, which clears their badge', async () => {
    const before = (await john.get('/conversations/unread-count')).body.count;
    expect((await john.post(`/conversations/${conversationId}/read`)).body.marked).toBe(1);
    expect((await john.get('/conversations/unread-count')).body.count).toBe(before - 1);
  });

  it("an unassigned pro can't see the job or the conversation", async () => {
    expect((await mike.get(`/bookings/${bookingId}`)).status).toBe(404);
    expect((await mike.get(`/conversations/${conversationId}`)).status).toBe(404);
  });

  it('dispatch assigns Mike; he becomes the moderator and the job shows in his area', async () => {
    const res = await admin.post(`/admin/bookings/${bookingId}/assign`, { providerId: providerIds['Mike Rodriguez'] });
    expect(res.status).toBe(200);
    const conv = await john.get(`/conversations/${conversationId}`);
    expect(conv.body.conversation.moderator.name).toBe('Mike Rodriguez');
    const jobs = await mike.get('/bookings?pageSize=50');
    expect(jobs.body.items.map((b: { id: string }) => b.id)).toContain(bookingId);
    const job = await mike.get(`/bookings/${bookingId}`);
    expect(job.body.booking.customer.name).toBe('John Doe');
    const proConv = await mike.get(`/conversations/${conversationId}`);
    expect(proConv.body.conversation).toMatchObject({ seat: 'moderator', permissions: { canPost: true, canModerate: true } });
    const audit = await db.auditLog.findFirst({ where: { action: 'booking.assign', targetId: bookingId } });
    expect(audit).not.toBeNull();
  });

  it('the pro and customer talk; the pro moderates', async () => {
    const pro = await mike.post(`/conversations/${conversationId}/messages`, { body: 'Hi John, Mike here.' });
    expect(pro.status).toBe(201);
    expect(pro.body.message.sender).toMatchObject({ kind: 'provider', moderator: true });
    const rude = await john.post(`/conversations/${conversationId}/messages`, { body: 'rude words' });
    expect(rude.status).toBe(201);
    expect((await john.del(`/conversations/${conversationId}/messages/${rude.body.message.id}`)).status).toBe(403);
    expect((await mike.del(`/conversations/${conversationId}/messages/${rude.body.message.id}`)).body.message.hidden).toBe(true);
    expect((await john.patch(`/conversations/${conversationId}`, { closed: true })).status).toBe(403);
    expect((await mike.patch(`/conversations/${conversationId}`, { closed: true })).body.conversation.closedAt).not.toBeNull();
    expect((await john.post(`/conversations/${conversationId}/messages`, { body: 'hello?' })).status).toBe(403);
    expect((await admin.post(`/conversations/${conversationId}/messages`, { body: 'Support: all good' })).status).toBe(201);
    expect((await mike.patch(`/conversations/${conversationId}`, { closed: false })).body.conversation.closedAt).toBeNull();
    expect((await john.post(`/conversations/${conversationId}/messages`, { body: 'thanks' })).status).toBe(201);
  });

  it('confirming keeps Mike; reassigning to James removes Mike from the thread and the job', async () => {
    const booking = (await john.get(`/bookings/${bookingId}`)).body.booking;
    const confirm = await admin.post(`/admin/bookings/${bookingId}/confirm`, {
      providerId: providerIds['Mike Rodriguez'],
      windowStart: booking.preferredSlot,
      windowEnd: '19:00',
      finalPriceCents: 22000,
    });
    expect(confirm.status).toBe(200);
    expect((await john.get(`/bookings/${bookingId}`)).body.booking.provider.phone).toBeTruthy(); // shared once confirmed
    expect((await admin.post(`/admin/bookings/${bookingId}/assign`, { providerId: providerIds['James Brown'] })).status).toBe(200);
    expect((await john.get(`/conversations/${conversationId}`)).body.conversation.moderator.name).toBe('James Brown');
    expect((await mike.get(`/conversations/${conversationId}`)).status).toBe(404);
    expect((await mike.post(`/conversations/${conversationId}/messages`, { body: 'x' })).status).toBe(404);
    expect((await mike.get(`/bookings/${bookingId}`)).status).toBe(404);
  });

  it('the customer reschedules (back to pending) and then cancels', async () => {
    const to = await freeSlot('moving', 3, 40);
    const r = await john.post(`/bookings/${bookingId}/reschedule`, { date: to.date, preferredSlot: to.slot });
    expect(r.status).toBe(200);
    expect(r.body.booking).toMatchObject({ status: 'pending', scheduledDate: to.date, windowStart: null });
    const c = await john.post(`/bookings/${bookingId}/cancel`, { reason: 'e2e done' });
    expect(c.body.booking).toMatchObject({ status: 'cancelled', cancelReason: 'e2e done' });
  });
});

describe('access control over HTTP', () => {
  it('the admin API is a 404 for customers, pros and signed-out visitors', async () => {
    for (const c of [john, mike, new Client()]) {
      expect((await c.get('/admin/overview')).status).toBe(404);
      expect((await c.get('/admin/bookings')).status).toBe(404);
    }
  });

  it('staff without a permission get 404 on that endpoint', async () => {
    const email = `support-${Date.now()}@movenow.test`;
    expect((await admin.post('/admin/staff', { email, fullName: 'Support Person', staffRole: 'support' })).status).toBe(201);
    await db.user.update({ where: { email }, data: { passwordHash: (await db.user.findUniqueOrThrow({ where: { email: 'admin@movenow.test' } })).passwordHash, emailVerifiedAt: new Date() } });
    const support = new Client();
    expect((await support.signInStaff(email)).status).toBe(200);
    expect((await support.get('/admin/bookings')).status).toBe(200); // bookings.view
    expect((await support.get('/admin/staff')).status).toBe(404); // staff.manage
    expect((await support.get('/admin/audit')).status).toBe(404); // audit.view
  });

  it('pros and staff cannot book', async () => {
    expect((await mike.post('/bookings', moveBody(await freeSlot()))).status).toBe(403);
    expect((await admin.post('/bookings', moveBody(await freeSlot()))).status).toBe(403);
  });

  it("customers can't see each other's bookings", async () => {
    const other = new Client();
    const email = `other-${Date.now()}@movenow.test`;
    await other.post('/auth/signup', { email, password: 'Oth3r-password' });
    const { plantOtp } = await import('../support/http');
    await other.post('/auth/signup/verify', { email, code: await plantOtp(email, 'signup') });
    const res = await john.post('/bookings', moveBody(await freeSlot()));
    expect((await other.get(`/bookings/${res.body.booking.id}`)).status).toBe(404);
    expect((await other.get(`/bookings/${res.body.booking.ref}`)).status).toBe(404);
  });
});

describe('profile, addresses and photos', () => {
  it('updates the profile and preferences', async () => {
    const me = await john.patch('/me', { fullName: 'John Doe', phone: '(305) 555-0123' });
    expect(me.body.user.phone).toBe('+13055550123');
    expect((await john.patch('/me', { email: 'x@y.test' })).status).toBe(400); // email can't change here
    const prefs = await john.patch('/me/preferences', { language: 'es', notifications: { promos: true } });
    expect(prefs.status).toBe(200);
    expect((await john.get('/auth/session')).body.user.preferences).toMatchObject({ language: 'es', notifications: { promos: true } });
    expect((await john.patch('/me/preferences', { timezone: 'Mars/Olympus' })).status).toBe(400);
    await john.patch('/me/preferences', { language: 'en', notifications: { promos: false } });
  });

  it('saved addresses: add, make default, edit, delete', async () => {
    const created = await john.post('/me/addresses', { label: 'Beach house', street: '1 Test Shore', city: 'Miami Beach', zip: '33139' });
    expect(created.status).toBe(201);
    const id = created.body.address.id;
    expect((await john.post(`/me/addresses/${id}/default`)).status).toBe(200);
    const list = await john.get('/me/addresses');
    expect(list.body.items.find((a: { id: string }) => a.id === id).isDefault).toBe(true);
    expect(list.body.items.filter((a: { isDefault: boolean }) => a.isDefault)).toHaveLength(1);
    expect((await john.patch(`/me/addresses/${id}`, { label: 'Beach' })).body.address.label).toBe('Beach');
    expect([200, 204]).toContain((await john.del(`/me/addresses/${id}`)).status);
    expect((await mike.del(`/me/addresses/${list.body.items[0].id}`)).status).toBe(404); // not theirs
  });

  it('booking photos: upload, read as owner and assigned pro, refuse others and non-images', async () => {
    const booking = (await john.post('/bookings', moveBody(await freeSlot()))).body.booking;
    const up = await john.request('POST', `/bookings/${booking.id}/photos`, imageForm(await makePng()));
    expect(up.status).toBe(201);
    expect(up.body.photo).toMatchObject({ width: 64, height: 48 });
    const url = `/bookings/${booking.id}/photos/${up.body.photo.id}`;
    const own = await john.get(url);
    expect(own.status).toBe(200);
    expect(own.headers.get('content-type')).toBe('image/webp');
    expect((await mike.get(url)).status).toBe(404);
    await admin.post(`/admin/bookings/${booking.id}/assign`, { providerId: providerIds['Mike Rodriguez'] });
    expect((await mike.get(url)).status).toBe(200);
    const fake = await john.request('POST', `/bookings/${booking.id}/photos`, imageForm(Buffer.from('not really an image'), 'evil.png'));
    expect(fake.status).toBe(400);
    expect([200, 204]).toContain((await john.del(url)).status);
  });

  it('avatar upload gives a public, cacheable image', async () => {
    const up = await john.request('POST', '/me/avatar', imageForm(await makePng(600, 600)));
    expect(up.status).toBe(200);
    const avatarUrl: string = up.body.user?.avatarUrl ?? up.body.avatarUrl;
    expect(avatarUrl).toMatch(/\/avatars\/[0-9a-f-]+\.webp$/);
    const res = await new Client().request('GET', new URL(avatarUrl, john.base).toString());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/immutable/);
  });
});

describe('pages', () => {
  it('signed-out visits to private pages go to sign-in, and /admin is a 404', async () => {
    const c = new Client();
    const dash = await c.page('/dashboard');
    expect([302, 307]).toContain(dash.status);
    expect(dash.headers.get('location')).toContain('/signin?next=%2Fdashboard');
    expect((await c.page('/pro')).status).toBeGreaterThanOrEqual(300);
    expect((await c.page('/admin')).status).toBe(404);
  });

  it('/pro is for pros only', async () => {
    expect((await mike.page('/pro')).status).toBe(200);
    const asCustomer = await john.page('/pro');
    expect(String(asCustomer.body)).not.toContain('here are your jobs');
  });

  it('public pages render', async () => {
    for (const path of ['/', '/signin', '/quote']) expect((await new Client().page(path)).status).toBe(200);
  });
});
