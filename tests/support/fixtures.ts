// Shared helpers for the integration tests: the seeded people as `Viewer`s, fresh accounts, free
// time slots and booking requests. Everything runs against the test database (see test-db.ts).
import { randomUUID } from 'node:crypto';
import { SLOT_TIMES, type ServiceTypeId } from '@/app/lib/catalog';
import { getAvailability } from '@/app/lib/server/availability';
import type { Viewer } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { addDays, todayInFlorida, toMinutes } from '@/app/lib/server/time';
import type { CreateBookingInput } from '@/app/lib/validation/booking';
import type { Role, StaffRole } from '@/generated/prisma/client';

export const ZIP = '33139'; // Miami Beach: covered by Miami-Dade, where every seeded pro works
export const NO_PRO_ZIP = '33401'; // Palm Beach: a service area with no providers

const asViewer = (u: { id: string; role: Role; staffRole: StaffRole | null; disabledAt: Date | null }): Viewer => ({
  id: u.id,
  role: u.role,
  staffRole: u.staffRole,
  disabledAt: u.disabledAt,
});

export async function userByEmail(email: string) {
  return asViewer(await db.user.findUniqueOrThrow({ where: { email } }));
}

/** Seeded people. The admin is a manager; the pros are linked to their provider rows. */
export async function seeded() {
  const [john, admin, mike, james, sarah, david] = await Promise.all(
    ['john.doe@movenow.test', 'admin@movenow.test', 'mike.rodriguez@movenow.test', 'james.brown@movenow.test', 'sarah.johnson@movenow.test', 'david.kim@movenow.test'].map(userByEmail),
  );
  const providers = await db.provider.findMany();
  const providerOf = (v: Viewer) => providers.find((p) => p.userId === v.id)!;
  return { john, admin, mike, james, sarah, david, providerOf };
}

export async function newCustomer(name = 'Test Customer') {
  const u = await db.user.create({
    data: { email: `customer-${randomUUID()}@movenow.test`, fullName: name, role: 'customer', emailVerifiedAt: new Date(), preferences: { create: {} } },
  });
  return asViewer(u);
}

export async function newStaff(staffRole: StaffRole) {
  const u = await db.user.create({
    data: { email: `staff-${randomUUID()}@movenow.test`, fullName: `Test ${staffRole}`, role: 'admin', staffRole, emailVerifiedAt: new Date(), preferences: { create: {} } },
  });
  return asViewer(u);
}

/**
 * The first date/slot (from `fromDay` days ahead) where the slot and every hour the job runs into
 * are free. Slots are shared by every customer, so each test asks for its own.
 */
export async function freeSlot(service: ServiceTypeId = 'tv_mounting', durationMin = 90, fromDay = 3, zip = ZIP) {
  const hours = Math.ceil(Math.max(60, durationMin) / 60);
  for (let d = fromDay; d < 85; d++) {
    const date = addDays(todayInFlorida(), d);
    const { slots } = await getAvailability({ service, zip, date });
    for (let i = 0; i + hours <= slots.length; i++) {
      if (slots.slice(i, i + hours).every((s) => s.available)) return { date, slot: slots[i].time };
    }
  }
  throw new Error('No free slot in the next 85 days');
}

const location = (street: string, zip = ZIP) => ({ street, city: 'Miami Beach', state: 'FL', zip, floor: 'ground' as const, elevator: true, parking: 'street' as const });

/** A plain wall-mount TV job: 90 minutes, so it takes two hourly slots. */
export function tvInput(when: { date: string; slot: string }, over: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    serviceType: 'tv_mounting',
    scheduledDate: when.date,
    preferredSlot: when.slot as (typeof SLOT_TIMES)[number],
    origin: location(`${Math.floor(Math.random() * 900) + 100} Test Ave`),
    details: { mountType: 'wall', tvSize: '56_65', wallType: 'drywall_wood', bracket: 'tilting', tvCount: 1, needsPowerOutlet: false },
    ...over,
  } as CreateBookingInput;
}

/** A 1-bedroom full move: 180 minutes. */
export function movingInput(when: { date: string; slot: string }): CreateBookingInput {
  return {
    serviceType: 'moving',
    scheduledDate: when.date,
    preferredSlot: when.slot as (typeof SLOT_TIMES)[number],
    origin: location('100 Origin St'),
    destination: location('200 Destination Ave', '33131'),
    details: { homeSize: '1br', volume: 'full', specialItems: [] },
    extraServices: [],
  } as CreateBookingInput;
}

/** The HTTP status an ApiError-throwing call ends with (200 if it resolves). */
export async function statusOf(p: Promise<unknown>) {
  try {
    await p;
    return 200;
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status) return status;
    throw e;
  }
}

export const slotEnd = (slot: string, min: number) => toMinutes(slot) + min;
