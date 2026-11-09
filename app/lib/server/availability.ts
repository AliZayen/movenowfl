import { SLOT_TIMES, type ServiceTypeId } from '@/app/lib/catalog';
import { db } from '@/app/lib/server/db';
import { errors } from '@/app/lib/server/http';
import { ACTIVE_STATUSES } from '@/app/lib/server/lifecycle';
import { addDays, nowMinutesInFlorida, slotLabel, toDbDate, todayInFlorida, toMinutes } from '@/app/lib/server/time';
import type { Prisma } from '@/generated/prisma/client';

export const BOOKING_HORIZON_DAYS = 90;
const SAME_DAY_LEAD_MIN = 120; // can't book a slot that starts in under 2 hours

type Tx = Prisma.TransactionClient;

/** All active areas covering a ZIP, most specific (fewest ZIPs) first. Throws 422 if none. */
export async function areasForZip(zip: string, client: Tx | typeof db = db) {
  const areas = await client.serviceArea.findMany({ where: { active: true, zips: { has: zip } } });
  if (areas.length === 0) throw errors.outOfArea(zip);
  return areas.sort((a, b) => a.zips.length - b.zips.length);
}

export interface Slot {
  time: string;
  label: string;
  available: boolean;
  reason?: 'past' | 'blocked' | 'full' | 'no_providers' | 'out_of_range';
}

/**
 * Slots for one service, ZIP and date. A booked time belongs to that customer only: any active booking
 * (any service, any area) makes every hour its estimated duration overlaps unavailable to everyone else.
 * `capacity` (providers serving this service and ZIP) only decides whether the service is offered at all.
 * `ignoreBookingId` lets a reschedule ignore the booking being moved.
 */
export async function getAvailability(
  params: { service: ServiceTypeId; zip: string; date: string; ignoreBookingId?: string },
  client: Tx | typeof db = db,
) {
  const { service, zip, date } = params;
  const areas = await areasForZip(zip, client);
  const areaIds = areas.map((a) => a.id);

  const today = todayInFlorida();
  const outOfRange = date < today || date > addDays(today, BOOKING_HORIZON_DAYS);

  const [capacity, blocks, bookings] = await Promise.all([
    client.provider.count({
      where: { active: true, services: { has: service }, serviceAreas: { some: { id: { in: areaIds } } } },
    }),
    client.availabilityBlock.findMany({
      where: {
        date: toDbDate(date),
        AND: [
          { OR: [{ serviceType: null }, { serviceType: service }] },
          { OR: [{ areaId: null }, { areaId: { in: areaIds } }] },
        ],
      },
    }),
    client.booking.findMany({
      where: {
        scheduledDate: toDbDate(date),
        status: { in: ACTIVE_STATUSES },
        ...(params.ignoreBookingId ? { NOT: { id: params.ignoreBookingId } } : {}),
      },
      select: { preferredSlot: true, windowStart: true, estimatedDurationMin: true },
    }),
  ]);

  const wholeDayBlocked = blocks.some((b) => b.slot === null);
  const blockedSlots = new Set(blocks.map((b) => b.slot).filter(Boolean));
  const nowMin = date === today ? nowMinutesInFlorida() : -1;

  // Hourly slots already taken by a booking.
  const taken = new Set<string>();
  for (const b of bookings) {
    const start = toMinutes(b.windowStart ?? b.preferredSlot);
    const end = start + Math.max(60, b.estimatedDurationMin);
    for (const s of SLOT_TIMES) {
      const m = toMinutes(s);
      if (m < end && m + 60 > start) taken.add(s);
    }
  }

  const slots: Slot[] = SLOT_TIMES.map((time) => {
    const base = { time, label: slotLabel(time) };
    if (outOfRange) return { ...base, available: false, reason: 'out_of_range' };
    if (capacity === 0) return { ...base, available: false, reason: 'no_providers' };
    if (wholeDayBlocked || blockedSlots.has(time)) return { ...base, available: false, reason: 'blocked' };
    if (nowMin >= 0 && toMinutes(time) < nowMin + SAME_DAY_LEAD_MIN) return { ...base, available: false, reason: 'past' };
    if (taken.has(time)) return { ...base, available: false, reason: 'full' };
    return { ...base, available: true };
  });

  return { date, service, zip, area: areas[0].name, capacity, slots };
}

/**
 * Re-check a slot inside a transaction right before writing. The advisory lock serializes all bookings
 * for the same date (slots are shared across services), so two people can't take the same time at once.
 * With `durationMin`, every later hour the job would run into must be free too.
 */
export async function lockAndAssertSlot(
  tx: Tx,
  params: { service: ServiceTypeId; zip: string; date: string; slot: string; durationMin?: number; ignoreBookingId?: string },
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`slot:${params.date}`}))`;
  const { slots } = await getAvailability(params, tx);
  const slot = slots.find((s) => s.time === params.slot);
  if (!slot?.available) {
    const why = slot?.reason === 'out_of_range' ? `Pick a date within the next ${BOOKING_HORIZON_DAYS} days` : 'That time is no longer available. Please pick another slot.';
    throw errors.conflict(why);
  }
  const start = toMinutes(params.slot);
  const end = start + Math.max(60, params.durationMin ?? 60);
  const clash = slots.find((s) => {
    const m = toMinutes(s.time);
    return m > start && m < end && !s.available;
  });
  if (clash) {
    throw errors.conflict(`This job takes about ${Math.ceil((end - start) / 60)} hours and runs into ${clash.label}, which isn't available. Please pick an earlier time or another day.`);
  }
}
