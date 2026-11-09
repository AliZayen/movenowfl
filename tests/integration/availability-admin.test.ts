import { beforeAll, describe, expect, it } from 'vitest';
import { getAvailability } from '@/app/lib/server/availability';
import { adminAssign, adminConfirm, adminSetStatus, createBooking, type Viewer } from '@/app/lib/server/bookings';
import { createBlock, createProvider, createStaff, deleteBlock, getAdminBooking, overview, updateProvider, updateStaff } from '@/app/lib/server/admin';
import { db } from '@/app/lib/server/db';
import { addDays, todayInFlorida } from '@/app/lib/server/time';
import { freeSlot, newCustomer, newStaff, NO_PRO_ZIP, seeded, statusOf, tvInput, ZIP } from '../support/fixtures';

let people: Awaited<ReturnType<typeof seeded>>;
let customer: Viewer;
beforeAll(async () => {
  people = await seeded();
  customer = await newCustomer('Avery Admin-Tests');
});

const slotsFor = async (date: string, service: 'tv_mounting' | 'moving' = 'tv_mounting', zip = ZIP) =>
  Object.fromEntries((await getAvailability({ service, zip, date })).slots.map((s) => [s.time, s.reason ?? 'ok']));

describe('availability', () => {
  it('offers 12 hourly slots from 8 AM to 7 PM with the area and capacity', async () => {
    const date = addDays(todayInFlorida(), 70);
    const a = await getAvailability({ service: 'tv_mounting', zip: ZIP, date });
    expect(a.slots.map((s) => s.time)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']);
    expect(a.area).toBe('Miami-Dade');
    expect(a.capacity).toBe(3); // David, Alex and Leo mount TVs
  });

  it('marks past dates and dates beyond 90 days as out of range', async () => {
    expect(Object.values(await slotsFor(addDays(todayInFlorida(), -1)))).toEqual(Array(12).fill('out_of_range'));
    expect(Object.values(await slotsFor(addDays(todayInFlorida(), 91)))).toEqual(Array(12).fill('out_of_range'));
  });

  it('says no_providers where nobody offers the service', async () => {
    expect((await slotsFor(addDays(todayInFlorida(), 10), 'tv_mounting', NO_PRO_ZIP))['10:00']).toBe('no_providers');
  });

  it('a 422 for a ZIP outside every area', async () => {
    expect(await statusOf(getAvailability({ service: 'moving', zip: '10001', date: addDays(todayInFlorida(), 5) }))).toBe(422);
  });

  it('a booking takes every hour its duration overlaps, for every service', async () => {
    const when = await freeSlot('tv_mounting', 180, 60);
    await createBooking(customer, tvInput(when)); // 90 minutes → two slots
    const s = await slotsFor(when.date, 'moving');
    const h = Number(when.slot.slice(0, 2));
    const at = (n: number) => `${String(n).padStart(2, '0')}:00`;
    expect([s[at(h)], s[at(h + 1)], s[at(h + 2)]]).toEqual(['full', 'full', 'ok']);
  });

  it('staff closures block a slot or a whole day, and removing them reopens it', async () => {
    const date = addDays(todayInFlorida(), 75);
    const slot = await createBlock({ date, slot: '10:00', serviceType: null, areaId: null, reason: 'test' });
    expect((await slotsFor(date))['10:00']).toBe('blocked');
    expect((await slotsFor(date))['11:00']).toBe('ok');
    const day = await createBlock({ date, slot: null, serviceType: 'moving', areaId: null });
    expect((await slotsFor(date, 'moving'))['15:00']).toBe('blocked');
    expect((await slotsFor(date, 'tv_mounting'))['15:00']).toBe('ok'); // only moving is closed
    await deleteBlock(slot.id);
    await deleteBlock(day.id);
    expect((await slotsFor(date))['10:00']).toBe('ok');
  });

  it("closures can't be in the past", async () => {
    expect(await statusOf(createBlock({ date: addDays(todayInFlorida(), -1), slot: null, serviceType: null, areaId: null }))).toBe(400);
  });
});

describe('dispatch', () => {
  it('confirming sets the pro, window and final price, in order on the timeline', async () => {
    const b = await createBooking(customer, tvInput(await freeSlot()));
    const david = people.providerOf(people.david);
    const c = await adminConfirm(people.admin, b.id, { providerId: david.id, windowStart: b.preferredSlot, windowEnd: '19:00', finalPriceCents: 9900 });
    expect(c).toMatchObject({ status: 'confirmed', windowStart: b.preferredSlot, windowEnd: '19:00', finalPriceCents: 9900 });
    expect(c.provider?.name).toBe('David Kim');
    expect(c.events.map((e) => e.type)).toEqual(['submitted', 'provider_assigned', 'confirmed']);
  });

  it("refuses a pro who doesn't offer the service, or is inactive", async () => {
    const b = await createBooking(customer, tvInput(await freeSlot()));
    const mike = people.providerOf(people.mike); // moving only
    expect(await statusOf(adminAssign(people.admin, b.id, mike.id))).toBe(400);
    const leo = await db.provider.findFirstOrThrow({ where: { displayName: 'Leo Martinez' } });
    await db.provider.update({ where: { id: leo.id }, data: { active: false } });
    try {
      expect(await statusOf(adminAssign(people.admin, b.id, leo.id))).toBe(400);
    } finally {
      await db.provider.update({ where: { id: leo.id }, data: { active: true } });
    }
  });

  it("refuses a pro who doesn't cover the ZIP", async () => {
    const area = await db.serviceArea.findUniqueOrThrow({ where: { name: 'Palm Beach' } });
    const far = await createProvider({ displayName: 'Far Away Pro', services: ['tv_mounting'], areaIds: [area.id], backgroundChecked: true, insured: true, active: true });
    const b = await createBooking(customer, tvInput(await freeSlot()));
    expect(await statusOf(adminAssign(people.admin, b.id, far.id))).toBe(400);
  });

  it('assigning the same pro twice is a 409', async () => {
    const b = await createBooking(customer, tvInput(await freeSlot()));
    const david = people.providerOf(people.david);
    await adminAssign(people.admin, b.id, david.id);
    expect(await statusOf(adminAssign(people.admin, b.id, david.id))).toBe(409);
  });

  it('start and complete follow the lifecycle and need a pro', async () => {
    const b = await createBooking(customer, tvInput(await freeSlot()));
    expect(await statusOf(adminSetStatus(people.admin, b.id, 'in_progress'))).toBe(409); // pending → in_progress isn't allowed
    await adminConfirm(people.admin, b.id, { providerId: people.providerOf(people.david).id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    expect((await adminSetStatus(people.admin, b.id, 'in_progress')).status).toBe('in_progress');
    const done = await adminSetStatus(people.admin, b.id, 'completed');
    expect(done.status).toBe('completed');
    expect(done.timeline.steps.every((s) => s.done)).toBe(true);
    expect(await statusOf(adminAssign(people.admin, b.id, people.providerOf(people.david).id))).toBe(409); // closed job
  });

  it('the staff booking view lists eligible pros', async () => {
    const b = await createBooking(customer, tvInput(await freeSlot()));
    const view = await getAdminBooking(people.admin, b.id);
    const names = (view as unknown as { candidates: { name: string }[] }).candidates.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['David Kim', 'Alex Wilson', 'Leo Martinez']));
    expect(names).not.toContain('Mike Rodriguez');
  });

  it('the overview counts pending and unassigned jobs', async () => {
    const before = (await overview()).counts;
    await createBooking(customer, tvInput(await freeSlot()));
    const after = (await overview()).counts;
    expect(after.pending).toBe(before.pending + 1);
    expect(after.unassigned).toBe(before.unassigned + 1);
    expect(after.supportUnread).toBe(before.supportUnread); // the welcome is from support, not unread for it
  });
});

describe('providers and staff', () => {
  it('creates and updates providers', async () => {
    const area = await db.serviceArea.findUniqueOrThrow({ where: { name: 'Broward' } });
    const p = await createProvider({ displayName: 'New Pro', services: ['moving'], areaIds: [area.id], phone: '+13055550000', backgroundChecked: false, insured: true, active: true });
    expect(p).toMatchObject({ name: 'New Pro' });
    const { provider } = await updateProvider(p.id, { active: false });
    expect(provider).toMatchObject({ active: false });
    expect(await statusOf(updateProvider('not-a-uuid', { active: true }))).toBe(404);
  });

  it("staff can't reuse an existing account's email", async () => {
    expect(await statusOf(createStaff({ email: 'john.doe@movenow.test', fullName: 'John Again', staffRole: 'support' }))).toBe(409);
  });

  it("there is always an active manager, and nobody changes their own access", async () => {
    const managers = await db.user.findMany({ where: { role: 'admin', staffRole: 'manager', disabledAt: null } });
    expect(managers).toHaveLength(1);
    const other = await newStaff('dispatcher');
    expect(await statusOf(updateStaff(other.id, managers[0].id, { disabled: true }))).toBe(409);
    expect(await statusOf(updateStaff(managers[0].id, managers[0].id, { staffRole: 'support' }))).toBe(409);
  });

  it('changing a staff role signs them out', async () => {
    const s = await newStaff('support');
    await db.session.create({ data: { tokenHash: `test-${s.id}`, userId: s.id, expiresAt: new Date(Date.now() + 3600_000) } });
    const { staff } = await updateStaff(people.admin.id, s.id, { staffRole: 'dispatcher' });
    expect(staff).toMatchObject({ staffRole: 'dispatcher' });
    expect(await db.session.count({ where: { userId: s.id } })).toBe(0);
  });
});
