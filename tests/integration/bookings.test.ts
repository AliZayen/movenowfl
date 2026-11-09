import { beforeAll, describe, expect, it } from 'vitest';
import {
  bookingStats,
  cancelBooking,
  createBooking,
  getBookingFor,
  listBookings,
  modifyBooking,
  rescheduleBooking,
  serializeDetail,
  adminAssign,
  adminSetStatus,
  adminConfirm,
  type Viewer,
} from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { listBookingsQuery, statsQuery } from '@/app/lib/validation/booking';
import { freeSlot, movingInput, newCustomer, NO_PRO_ZIP, seeded, statusOf, tvInput } from '../support/fixtures';

let people: Awaited<ReturnType<typeof seeded>>;
let alice: Viewer;
let bob: Viewer;

beforeAll(async () => {
  people = await seeded();
  alice = await newCustomer('Alice Tester');
  bob = await newCustomer('Bob Tester');
});

// What the API returns for a booking, as this viewer.
const detail = async (v: Viewer, id: string) => serializeDetail(await getBookingFor(v, id), v);
const list = (v: Viewer, q: Record<string, string> = {}) => listBookings(v, listBookingsQuery.parse(q));

describe('creating a booking', () => {
  it('saves a pending booking with a ref, quote, cover image and a "submitted" event', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    expect(b.ref).toMatch(/^MN-\d{4}-\d{4}$/);
    expect(b.status).toBe('pending');
    expect(b.quotedPriceCents).toBe(7000);
    expect(b.estimatedDurationMin).toBe(90);
    expect(b.coverImageUrl).toBeTruthy();
    expect(b.events.map((e) => e.type)).toEqual(['submitted']);
    expect(b.timeline.steps[0]).toMatchObject({ key: 'submitted', done: true });
    expect(b.permissions).toMatchObject({ canCancel: true, canReschedule: true, canModify: true });
  });

  it('numbers refs one after another', async () => {
    const a = await createBooking(alice, tvInput(await freeSlot()));
    const b = await createBooking(alice, tvInput(await freeSlot()));
    expect(Number(b.ref.slice(-4))).toBe(Number(a.ref.slice(-4)) + 1);
  });

  it('opens a support conversation with a welcome message in the same transaction', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    const c = await db.conversation.findUniqueOrThrow({ where: { bookingId: b.id }, include: { messages: true } });
    expect(c).toMatchObject({ customerId: alice.id, providerId: null });
    expect(c.messages).toHaveLength(1);
    expect(c.messages[0]).toMatchObject({ author: 'support', senderId: null });
    expect(c.messages[0].body).toContain(b.ref);
  });

  it('keeps job addresses as their own rows (not linked to saved addresses)', async () => {
    const b = await createBooking(alice, movingInput(await freeSlot('moving', 180)));
    const row = await db.booking.findUniqueOrThrow({ where: { id: b.id }, include: { originAddress: true, destinationAddress: true } });
    expect(row.originAddress.userId).toBeNull();
    expect(row.destinationAddress?.zip).toBe('33131');
  });

  it('refuses a ZIP outside the service areas with 422', async () => {
    const when = await freeSlot();
    const input = tvInput(when);
    input.origin.zip = '90210';
    expect(await statusOf(createBooking(alice, input))).toBe(422);
  });

  it('refuses a slot with no providers for that service', async () => {
    const when = await freeSlot();
    const input = tvInput(when);
    input.origin.zip = NO_PRO_ZIP;
    expect(await statusOf(createBooking(alice, input))).toBe(409);
  });

  it('refuses dates more than 90 days ahead', async () => {
    expect(await statusOf(createBooking(alice, tvInput({ date: '2099-01-01', slot: '10:00' })))).toBe(409);
  });

  it("pro and staff accounts can't book (customers only)", async () => {
    expect(await statusOf(createBooking(people.mike, tvInput(await freeSlot())))).toBe(403);
    expect(await statusOf(createBooking(people.admin, tvInput(await freeSlot())))).toBe(403);
  });

  it('a failed booking leaves nothing behind (no booking, no conversation)', async () => {
    const before = await Promise.all([db.booking.count(), db.conversation.count(), db.message.count()]);
    expect(await statusOf(createBooking(alice, tvInput({ date: '2099-01-01', slot: '10:00' })))).toBe(409);
    expect(await Promise.all([db.booking.count(), db.conversation.count(), db.message.count()])).toEqual(before);
  });
});

describe('time slots are shared by every customer', () => {
  it("another customer can't take a booked time", async () => {
    const when = await freeSlot();
    await createBooking(alice, tvInput(when));
    expect(await statusOf(createBooking(bob, tvInput(when)))).toBe(409);
  });

  it('a long job blocks the hours it runs into', async () => {
    const when = await freeSlot('moving', 180);
    await createBooking(alice, movingInput(when)); // 3 hours
    const nextHour = `${String(Number(when.slot.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    expect(await statusOf(createBooking(bob, tvInput({ date: when.date, slot: nextHour })))).toBe(409);
  });

  it('two simultaneous requests for the same time: exactly one wins', async () => {
    const when = await freeSlot();
    const results = await Promise.allSettled([createBooking(alice, tvInput(when)), createBooking(bob, tvInput(when))]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const lost = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(lost.reason.status).toBe(409);
  });

  it('cancelling frees the time again', async () => {
    const when = await freeSlot();
    const b = await createBooking(alice, tvInput(when));
    await cancelBooking(alice, b.id, { reason: 'test' });
    expect((await createBooking(bob, tvInput(when))).status).toBe('pending');
  });
});

describe('who can see what', () => {
  it("customers see only their own bookings; others' are 404, by id or ref", async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    expect((await getBookingFor(alice, b.ref.toLowerCase())).id).toBe(b.id);
    expect(await statusOf(getBookingFor(bob, b.id))).toBe(404);
    expect(await statusOf(getBookingFor(bob, b.ref))).toBe(404);
    expect((await list(bob, { pageSize: '50' })).items.some((x) => x.id === b.id)).toBe(false);
  });

  it('pros see only jobs assigned to them, and staff see everything', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    expect(await statusOf(getBookingFor(people.david, b.id))).toBe(404);
    await adminAssign(people.admin, b.id, people.providerOf(people.david).id);
    expect((await detail(people.david, b.id)).customer?.name).toBe('Alice Tester');
    expect(await statusOf(getBookingFor(people.mike, b.id))).toBe(404);
    expect((await getBookingFor(people.admin, b.id)).id).toBe(b.id);
    const mine = await list(people.david, { pageSize: '50' });
    expect(mine.items.every((x) => x.provider?.name === 'David Kim')).toBe(true);
  });

  it("the pro gets the customer's phone only once the job is confirmed", async () => {
    await db.user.update({ where: { id: alice.id }, data: { phone: '+13055559999' } });
    const b = await createBooking(alice, tvInput(await freeSlot()));
    await adminAssign(people.admin, b.id, people.providerOf(people.david).id);
    expect((await detail(people.david, b.id)).customer?.phone).toBeNull();
    await adminConfirm(people.admin, b.id, { providerId: people.providerOf(people.david).id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    expect((await detail(people.david, b.id)).customer?.phone).toBe('+13055559999');
  });

  it('customers see the pro phone only once confirmed', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    await adminAssign(people.admin, b.id, people.providerOf(people.david).id);
    const pending = await detail(alice, b.id);
    expect(pending.provider && 'phone' in pending.provider).toBe(false);
    expect(pending.customer).toBeNull(); // customers don't get a copy of their own contact
    await adminConfirm(people.admin, b.id, { providerId: people.providerOf(people.david).id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    expect((await detail(alice, b.id)).provider).toHaveProperty('phone');
  });
});

describe('lists and stats', () => {
  it('filters by status, service and search, and paginates', async () => {
    const carol = await newCustomer('Carol Lister');
    const b1 = await createBooking(carol, tvInput(await freeSlot()));
    const b2 = await createBooking(carol, movingInput(await freeSlot('moving', 180)));
    await cancelBooking(carol, b2.id, {});
    expect((await list(carol)).total).toBe(2);
    expect((await list(carol, { status: 'cancelled' })).items.map((x) => x.id)).toEqual([b2.id]);
    expect((await list(carol, { service: 'tv_mounting' })).items.map((x) => x.id)).toEqual([b1.id]);
    expect((await list(carol, { q: b1.ref })).items.map((x) => x.id)).toEqual([b1.id]);
    expect((await list(carol, { q: 'tv mount' })).items.map((x) => x.id)).toEqual([b1.id]);
    const page = await list(carol, { pageSize: '1', page: '2' });
    expect(page).toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
    expect(page.items).toHaveLength(1);
    const stats = await bookingStats(carol, statsQuery.parse({}));
    expect(stats).toMatchObject({ total: 2, pending: 1, cancelled: 1, upcoming: 1 });
  });

  it('upcomingFirst puts open bookings soonest first, then the rest', async () => {
    const dan = await newCustomer('Dan Sorter');
    const later = await createBooking(dan, tvInput(await freeSlot('tv_mounting', 90, 40)));
    const sooner = await createBooking(dan, tvInput(await freeSlot('tv_mounting', 90, 5)));
    const closed = await createBooking(dan, tvInput(await freeSlot('tv_mounting', 90, 20)));
    await cancelBooking(dan, closed.id, {});
    expect((await list(dan)).items.map((x) => x.id)).toEqual([sooner.id, later.id, closed.id]);
  });
});

describe('customer changes', () => {
  it('modifying details re-quotes and records what changed', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    const m = await modifyBooking(alice, b.id, { details: { tvSize: '76_plus' }, notes: 'Gate code 1234' });
    expect(m.quotedPriceCents).toBe(7000 + 4000);
    expect(m.notes).toBe('Gate code 1234');
    expect(m.events.at(-1)).toMatchObject({ type: 'modified', payload: { changed: ['details', 'notes'] } });
  });

  it("other customers can't change it", async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    expect(await statusOf(modifyBooking(bob, b.id, { notes: 'x' }))).toBe(404);
    expect(await statusOf(cancelBooking(bob, b.id, {}))).toBe(404);
  });

  it('within 24 hours of the window only staff can change details', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    // Move it to tomorrow morning directly, as if it had been booked earlier.
    const tomorrow = new Date(Date.now() + 20 * 3600_000).toISOString().slice(0, 10);
    await db.booking.update({ where: { id: b.id }, data: { scheduledDate: new Date(`${tomorrow}T00:00:00Z`), preferredSlot: '08:00' } });
    expect(await statusOf(modifyBooking(alice, b.id, { notes: 'late change' }))).toBe(409);
    expect((await modifyBooking(people.admin, b.id, { notes: 'staff change' })).notes).toBe('staff change');
  });

  it('rescheduling moves the time, clears the window and sends a confirmed booking back to pending', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    await adminConfirm(people.admin, b.id, { providerId: people.providerOf(people.david).id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    const to = await freeSlot('tv_mounting', 90, 30);
    const r = await rescheduleBooking(alice, b.id, { date: to.date, preferredSlot: to.slot as never, reason: 'busy' });
    expect(r).toMatchObject({ status: 'pending', scheduledDate: to.date, preferredSlot: to.slot, windowStart: null, windowEnd: null });
    expect(r.events.at(-1)).toMatchObject({ type: 'rescheduled' });
    expect(await statusOf(rescheduleBooking(alice, b.id, { date: to.date, preferredSlot: to.slot as never }))).toBe(409); // same time
  });

  it('rescheduling to a taken time is refused', async () => {
    const mine = await createBooking(alice, tvInput(await freeSlot()));
    const other = await createBooking(bob, tvInput(await freeSlot()));
    expect(await statusOf(rescheduleBooking(alice, mine.id, { date: other.scheduledDate, preferredSlot: other.preferredSlot as never }))).toBe(409);
  });

  it('a booking can move by an hour into time it already holds', async () => {
    const when = await freeSlot('tv_mounting', 180); // three free hours, the job takes two
    const mine = await createBooking(alice, tvInput(when));
    const nextHour = `${String(Number(when.slot.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    const moved = await rescheduleBooking(alice, mine.id, { date: when.date, preferredSlot: nextHour as never });
    expect(moved.preferredSlot).toBe(nextHour);
  });

  it('cancelling: customers can cancel open bookings, but not a job in progress', async () => {
    const b = await createBooking(alice, tvInput(await freeSlot()));
    await adminConfirm(people.admin, b.id, { providerId: people.providerOf(people.david).id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    await adminSetStatus(people.admin, b.id, 'in_progress');
    expect(await statusOf(cancelBooking(alice, b.id, {}))).toBe(409);
    const c = await cancelBooking(people.admin, b.id, { reason: 'staff cancel' });
    expect(c).toMatchObject({ status: 'cancelled', cancelReason: 'staff cancel' });
    expect(await statusOf(cancelBooking(people.admin, b.id, {}))).toBe(409); // already cancelled
  });
});
