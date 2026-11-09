import { SERVICE_LABELS, SERVICE_TYPES, type ServiceTypeId } from '@/app/lib/catalog';
import { areasForZip, lockAndAssertSlot } from '@/app/lib/server/availability';
import { openBookingConversation, setConversationModerator } from '@/app/lib/server/booking-conversation';
import { db } from '@/app/lib/server/db';
import { errors, isUuid, paginate } from '@/app/lib/server/http';
import { ACTIVE_STATUSES, assertTransition, MODIFY_CUTOFF_MS, OPEN_STATUSES } from '@/app/lib/server/lifecycle';
import { estimate, type EstimateInput } from '@/app/lib/server/pricing';
import { canEditPhotos, serializePhoto } from '@/app/lib/server/photos';
import { floridaToUtc, fromDbDate, toDbDate, todayInFlorida } from '@/app/lib/server/time';
import {
  furnitureDetailsSchema,
  movingDetailsSchema,
  tvDetailsSchema,
  type CreateBookingInput,
} from '@/app/lib/validation/booking';
import type { z } from 'zod';
import type {
  adminConfirmSchema,
  cancelSchema,
  listBookingsQuery,
  modifyBookingSchema,
  rescheduleSchema,
  statsQuery,
} from '@/app/lib/validation/booking';
import { can } from '@/app/lib/staff';
import { Prisma, type Address, type BookingStatus, type Provider, type Role, type StaffRole } from '@/generated/prisma/client';

export interface Viewer {
  id: string;
  role: Role;
  staffRole?: StaffRole | null;
  disabledAt?: Date | null;
}

// Staff may act on any booking only with bookings.manage (support staff can only read).
const canManage = (viewer: Viewer) => can(viewer, 'bookings.manage');

const listInclude = { originAddress: true, destinationAddress: true, provider: true } satisfies Prisma.BookingInclude;
const detailInclude = {
  ...listInclude,
  customer: { select: { fullName: true, phone: true } },
  photos: { orderBy: { createdAt: 'asc' } },
  events: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { fullName: true, role: true } } } },
} satisfies Prisma.BookingInclude;

type ListBooking = Prisma.BookingGetPayload<{ include: typeof listInclude }>;
type DetailBooking = Prisma.BookingGetPayload<{ include: typeof detailInclude }>;

const DETAIL_SCHEMAS = {
  moving: movingDetailsSchema,
  furniture_assembly: furnitureDetailsSchema,
  tv_mounting: tvDetailsSchema,
} as const;

// ─── Serialization ──────────────────────────────────────────────────────────

export const formatAddress = (a: Address) =>
  [a.apt ? `${a.street} ${a.apt}` : a.street, a.city, a.state, a.zip].join(', ');

export function serializeProvider(p: Provider, opts: { includePhone?: boolean } = {}) {
  return {
    id: p.id,
    name: p.displayName,
    avatarUrl: p.avatarUrl,
    avatarAlt: p.avatarAlt,
    rating: Number(p.ratingAvg),
    reviewCount: p.reviewCount,
    backgroundChecked: p.backgroundChecked,
    insured: p.insured,
    ...(opts.includePhone ? { phone: p.phone } : {}),
  };
}

export function serializeListItem(b: ListBooking) {
  return {
    id: b.id,
    ref: b.ref,
    serviceType: b.serviceType,
    serviceLabel: SERVICE_LABELS[b.serviceType],
    status: b.status,
    scheduledDate: fromDbDate(b.scheduledDate),
    preferredSlot: b.preferredSlot,
    windowStart: b.windowStart,
    windowEnd: b.windowEnd,
    estimatedDurationMin: b.estimatedDurationMin,
    address: formatAddress(b.originAddress),
    destinationAddress: b.destinationAddress ? formatAddress(b.destinationAddress) : null,
    coverImageUrl: b.coverImageUrl,
    quotedPriceCents: b.quotedPriceCents,
    finalPriceCents: b.finalPriceCents,
    provider: b.provider ? serializeProvider(b.provider) : null,
    createdAt: b.createdAt.toISOString(),
  };
}

function location(a: Address, floor: string | null, elevator: boolean | null, parking: string | null, notes: string | null) {
  return {
    street: a.street,
    apt: a.apt,
    city: a.city,
    state: a.state,
    zip: a.zip,
    formatted: formatAddress(a),
    floor,
    elevator,
    parking,
    accessNotes: notes,
  };
}

function timeline(b: DetailBooking) {
  const last = (type: string) => [...b.events].reverse().find((e) => e.type === type)?.createdAt.toISOString() ?? null;
  const reached: Record<BookingStatus, number> = { pending: 1, confirmed: 2, in_progress: 3, completed: 4, cancelled: 1 };
  const done = reached[b.status];
  const steps = [
    { key: 'submitted', label: 'Request submitted', at: last('submitted') },
    { key: 'confirmed', label: 'Confirmed', at: last('confirmed') },
    { key: 'service_day', label: 'Service day', at: last('started') },
    { key: 'completed', label: 'Completed', at: last('completed') },
  ].map((s, i) => ({ ...s, done: i < done, current: b.status !== 'cancelled' && i === done }));
  return { steps, cancelled: b.status === 'cancelled', cancelledAt: b.cancelledAt?.toISOString() ?? null };
}

function permissions(b: { status: BookingStatus; customerId: string; scheduledDate: Date; preferredSlot: string; windowStart: string | null }, viewer: Viewer) {
  const isOwner = b.customerId === viewer.id;
  const isAdmin = canManage(viewer);
  const open = OPEN_STATUSES.includes(b.status);
  const beforeCutoff = startsAt(b).getTime() - Date.now() >= MODIFY_CUTOFF_MS;
  return {
    canCancel: (isOwner && open) || (isAdmin && (open || b.status === 'in_progress')),
    canReschedule: (isOwner || isAdmin) && open,
    canModify: open && ((isOwner && beforeCutoff) || isAdmin),
    canEditPhotos: canEditPhotos(b, viewer),
  };
}

export function serializeDetail(b: DetailBooking, viewer: Viewer) {
  // The provider's phone is shared only once the job is confirmed (README 8.5).
  const showPhone = viewer.role !== 'customer' || ['confirmed', 'in_progress'].includes(b.status);
  return {
    ...serializeListItem(b),
    provider: b.provider ? serializeProvider(b.provider, { includePhone: showPhone }) : null,
    dateFlexibility: b.dateFlexibility,
    origin: location(b.originAddress, b.originFloor, b.originElevator, b.originParking, b.originAccessNotes),
    destination: b.destinationAddress
      ? location(b.destinationAddress, b.destinationFloor, b.destinationElevator, b.destinationParking, b.destinationAccessNotes)
      : null,
    details: b.details,
    extraServices: b.extraServices,
    notes: b.notes,
    photos: b.photos.map(serializePhoto),
    cancelReason: b.cancelReason,
    events: b.events.map((e) => ({
      id: e.id,
      type: e.type,
      at: e.createdAt.toISOString(),
      actor: e.actor ? { name: e.actor.fullName, role: e.actor.role } : null,
      payload: e.payload,
    })),
    // Providers and staff see who the job is for; customers already know.
    customer: viewer.role === 'customer' ? null : { name: b.customer.fullName, phone: viewer.role === 'provider' && !['confirmed', 'in_progress'].includes(b.status) ? null : b.customer.phone },
    timeline: timeline(b),
    permissions: permissions(b, viewer),
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

function scopeWhere(viewer: Viewer): Prisma.BookingWhereInput {
  if (viewer.role === 'admin') return {};
  if (viewer.role === 'provider') return { provider: { userId: viewer.id } };
  return { customerId: viewer.id };
}

function searchWhere(q?: string): Prisma.BookingWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: 'insensitive' as const };
  const services = SERVICE_TYPES.filter((t) => SERVICE_LABELS[t].toLowerCase().includes(q.toLowerCase()));
  return {
    OR: [
      { ref: contains },
      { originAddress: { street: contains } },
      { originAddress: { city: contains } },
      { originAddress: { zip: { startsWith: q } } },
      { provider: { displayName: contains } },
      ...(services.length ? [{ serviceType: { in: services } }] : []),
    ],
  };
}

function dateWhere(from?: string, to?: string): Prisma.BookingWhereInput {
  if (!from && !to) return {};
  return { scheduledDate: { ...(from ? { gte: toDbDate(from) } : {}), ...(to ? { lte: toDbDate(to) } : {}) } };
}

const upcomingWhere = (): Prisma.BookingWhereInput => ({
  status: { in: ACTIVE_STATUSES },
  scheduledDate: { gte: toDbDate(todayInFlorida()) },
});

export async function listBookings(viewer: Viewer, query: z.output<typeof listBookingsQuery>) {
  const where: Prisma.BookingWhereInput = {
    AND: [
      scopeWhere(viewer),
      searchWhere(query.q),
      dateWhere(query.from, query.to),
      query.status ? { status: query.status } : {},
      query.service ? { serviceType: query.service } : {},
      query.upcoming ? upcomingWhere() : {},
    ],
  };
  const { page, pageSize } = query;
  const skip = (page - 1) * pageSize;
  const total = await db.booking.count({ where });

  let items: ListBooking[];
  if (query.sort === 'upcomingFirst') {
    // Open bookings soonest first, then everything else newest first, paginated across both.
    const openWhere = { AND: [where, { status: { in: ACTIVE_STATUSES } }] };
    const closedWhere = { AND: [where, { status: { notIn: ACTIVE_STATUSES } }] };
    const openCount = await db.booking.count({ where: openWhere });
    const open =
      skip < openCount
        ? await db.booking.findMany({ where: openWhere, include: listInclude, orderBy: [{ scheduledDate: 'asc' }, { preferredSlot: 'asc' }], skip, take: pageSize })
        : [];
    const remaining = pageSize - open.length;
    const closed =
      remaining > 0
        ? await db.booking.findMany({ where: closedWhere, include: listInclude, orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }], skip: Math.max(0, skip - openCount), take: remaining })
        : [];
    items = [...open, ...closed];
  } else {
    const desc = query.sort.startsWith('-');
    const field = query.sort.replace('-', '') as 'scheduledDate' | 'createdAt';
    items = await db.booking.findMany({ where, include: listInclude, orderBy: { [field]: desc ? 'desc' : 'asc' }, skip, take: pageSize });
  }

  return { items: items.map(serializeListItem), ...paginate(page, pageSize, total) };
}

export async function bookingStats(viewer: Viewer, query: z.output<typeof statsQuery>) {
  const where: Prisma.BookingWhereInput = { AND: [scopeWhere(viewer), searchWhere(query.q), dateWhere(query.from, query.to)] };
  const [groups, upcoming] = await Promise.all([
    db.booking.groupBy({ by: ['status'], where, _count: { _all: true } }),
    db.booking.count({ where: { AND: [where, upcomingWhere()] } }),
  ]);
  const count = (s: BookingStatus) => groups.find((g) => g.status === s)?._count._all ?? 0;
  return {
    total: groups.reduce((sum, g) => sum + g._count._all, 0),
    upcoming,
    pending: count('pending'),
    confirmed: count('confirmed'),
    inProgress: count('in_progress'),
    completed: count('completed'),
    cancelled: count('cancelled'),
  };
}

/** Finds a booking by id or ref that the viewer may see. Returns 404 (not 403) so refs can't be probed. */
export async function getBookingFor(viewer: Viewer, idOrRef: string) {
  const booking = await db.booking.findFirst({
    where: { AND: [scopeWhere(viewer), isUuid(idOrRef) ? { id: idOrRef } : { ref: idOrRef.toUpperCase() }] },
    include: detailInclude,
  });
  if (!booking) throw errors.notFound('Booking');
  return booking;
}

const reload = async (viewer: Viewer, id: string) => serializeDetail(await getBookingFor(viewer, id), viewer);

// ─── Estimate & create ──────────────────────────────────────────────────────

async function activeService(type: ServiceTypeId) {
  const service = await db.service.findUnique({ where: { id: type } });
  if (!service?.active) throw errors.validation('This service is not available right now');
  return service;
}

function toEstimateInput(input: CreateBookingInput): EstimateInput {
  if (input.serviceType === 'moving') {
    return { serviceType: 'moving', details: input.details, origin: input.origin, destination: input.destination, extraServices: input.extraServices };
  }
  return input.serviceType === 'furniture_assembly'
    ? { serviceType: input.serviceType, details: input.details }
    : { serviceType: input.serviceType, details: input.details };
}

export async function estimateBooking(input: CreateBookingInput) {
  const service = await activeService(input.serviceType);
  const areas = await areasForZip(input.origin.zip);
  return { ...estimate(toEstimateInput(input), service.startingPriceCents), area: areas[0].name };
}

async function nextRef(tx: Prisma.TransactionClient) {
  const year = Number(todayInFlorida().slice(0, 4));
  const [{ last }] = await tx.$queryRaw<{ last: number }[]>`
    INSERT INTO booking_ref_counters (year, last) VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last = booking_ref_counters.last + 1
    RETURNING last`;
  return `MN-${year}-${String(last).padStart(4, '0')}`;
}

const addressData = (a: { street: string; apt?: string | null; city: string; state: string; zip: string }) => ({
  street: a.street,
  apt: a.apt || null,
  city: a.city,
  state: a.state,
  zip: a.zip,
});

export async function createBooking(viewer: Viewer, input: CreateBookingInput) {
  // Bookings belong to a customer account; staff and pros have their own areas and can't book.
  if (viewer.role !== 'customer') throw errors.forbidden('Only customer accounts can book services. Please use a customer account.');
  const service = await activeService(input.serviceType);
  await areasForZip(input.origin.zip); // 422 if we don't serve the job address
  const est = estimate(toEstimateInput(input), service.startingPriceCents);
  const dest = input.serviceType === 'moving' ? input.destination : null;

  const id = await db.$transaction(async (tx) => {
    await lockAndAssertSlot(tx, { service: input.serviceType, zip: input.origin.zip, date: input.scheduledDate, slot: input.preferredSlot, durationMin: est.estimatedDurationMin });
    const ref = await nextRef(tx);
    const origin = await tx.address.create({ data: addressData(input.origin) });
    const destination = dest ? await tx.address.create({ data: addressData(dest) }) : null;
    const booking = await tx.booking.create({
      data: {
        ref,
        customerId: viewer.id,
        serviceType: input.serviceType,
        scheduledDate: toDbDate(input.scheduledDate),
        preferredSlot: input.preferredSlot,
        dateFlexibility: input.dateFlexibility,
        estimatedDurationMin: est.estimatedDurationMin,
        originAddressId: origin.id,
        originFloor: input.origin.floor,
        originElevator: input.origin.elevator,
        originParking: input.origin.parking,
        originAccessNotes: input.origin.accessNotes,
        destinationAddressId: destination?.id,
        destinationFloor: dest?.floor,
        destinationElevator: dest?.elevator,
        destinationParking: dest?.parking,
        destinationAccessNotes: dest?.accessNotes,
        details: input.details,
        extraServices: input.serviceType === 'moving' ? input.extraServices : [],
        notes: input.notes,
        quotedPriceCents: est.quotedPriceCents,
        coverImageUrl: service.imageUrl,
        events: { create: { type: 'submitted', actorId: viewer.id, payload: { quotedPriceCents: est.quotedPriceCents } } },
      },
    });
    // Every booking comes with a support conversation and a welcome message (README 8.7).
    const customer = await tx.user.findUniqueOrThrow({ where: { id: viewer.id }, select: { fullName: true } });
    await openBookingConversation(tx, booking, customer.fullName);
    return booking.id;
  });
  return reload(viewer, id);
}

// ─── Customer actions ───────────────────────────────────────────────────────

function startsAt(b: { scheduledDate: Date; preferredSlot: string; windowStart: string | null }) {
  return floridaToUtc(fromDbDate(b.scheduledDate), b.windowStart ?? b.preferredSlot);
}

function assertCanChange(b: DetailBooking, viewer: Viewer) {
  if (!canManage(viewer) && b.customerId !== viewer.id) throw errors.forbidden();
}

export async function modifyBooking(viewer: Viewer, idOrRef: string, input: z.output<typeof modifyBookingSchema>) {
  const b = await getBookingFor(viewer, idOrRef);
  assertCanChange(b, viewer);
  if (!OPEN_STATUSES.includes(b.status)) throw errors.conflict(`A ${b.status.replace('_', ' ')} booking can't be changed`);
  if (!canManage(viewer) && startsAt(b).getTime() - Date.now() < MODIFY_CUTOFF_MS) {
    throw errors.conflict('Changes are allowed up to 24 hours before your arrival window. Please call us instead.');
  }
  if (input.destination && b.serviceType !== 'moving') throw errors.validation('Only moves have a destination');

  const data: Prisma.BookingUpdateInput = {};
  const changed: string[] = [];
  let details = b.details as Record<string, unknown>;

  if (input.details) {
    details = DETAIL_SCHEMAS[b.serviceType].parse({ ...details, ...input.details }) as Record<string, unknown>;
    data.details = details as Prisma.InputJsonValue;
    changed.push('details');
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
    changed.push('notes');
  }
  for (const side of ['origin', 'destination'] as const) {
    const a = input[side];
    if (!a) continue;
    if (a.floor !== undefined) data[`${side}Floor`] = a.floor;
    if (a.elevator !== undefined) data[`${side}Elevator`] = a.elevator;
    if (a.parking !== undefined) data[`${side}Parking`] = a.parking;
    if (a.accessNotes !== undefined) data[`${side}AccessNotes`] = a.accessNotes;
    changed.push(side);
  }

  // Re-quote while the price is still an estimate.
  if (!b.finalPriceCents && (input.details || input.origin || input.destination)) {
    const service = await activeService(b.serviceType);
    const access = (side: 'origin' | 'destination') => ({
      floor: input[side]?.floor ?? (side === 'origin' ? b.originFloor : b.destinationFloor) ?? undefined,
      elevator: input[side]?.elevator ?? (side === 'origin' ? b.originElevator : b.destinationElevator) ?? undefined,
    });
    const est = estimate(
      b.serviceType === 'moving'
        ? { serviceType: 'moving', details: details as never, origin: access('origin'), destination: access('destination'), extraServices: b.extraServices }
        : ({ serviceType: b.serviceType, details } as EstimateInput),
      service.startingPriceCents,
    );
    data.quotedPriceCents = est.quotedPriceCents;
    data.estimatedDurationMin = est.estimatedDurationMin;
  }

  await db.booking.update({
    where: { id: b.id },
    data: { ...data, events: { create: { type: 'modified', actorId: viewer.id, payload: { changed } } } },
  });
  return reload(viewer, b.id);
}

export async function rescheduleBooking(viewer: Viewer, idOrRef: string, input: z.output<typeof rescheduleSchema>) {
  const b = await getBookingFor(viewer, idOrRef);
  assertCanChange(b, viewer);
  if (!OPEN_STATUSES.includes(b.status)) throw errors.conflict(`A ${b.status.replace('_', ' ')} booking can't be rescheduled`);
  const from = { date: fromDbDate(b.scheduledDate), slot: b.windowStart ?? b.preferredSlot };
  if (from.date === input.date && b.preferredSlot === input.preferredSlot) throw errors.conflict("That's already your booking time");
  if (b.status === 'confirmed') assertTransition('confirmed', 'pending');

  await db.$transaction(async (tx) => {
    await lockAndAssertSlot(tx, {
      service: b.serviceType,
      zip: b.originAddress.zip,
      date: input.date,
      slot: input.preferredSlot,
      durationMin: b.estimatedDurationMin,
      ignoreBookingId: b.id,
    });
    await tx.booking.update({
      where: { id: b.id },
      data: {
        scheduledDate: toDbDate(input.date),
        preferredSlot: input.preferredSlot,
        windowStart: null, // the new window needs confirming again
        windowEnd: null,
        status: 'pending',
        events: {
          create: {
            type: 'rescheduled',
            actorId: viewer.id,
            payload: { from, to: { date: input.date, slot: input.preferredSlot }, reason: input.reason ?? null },
          },
        },
      },
    });
  });
  return reload(viewer, b.id);
}

export async function cancelBooking(viewer: Viewer, idOrRef: string, input: z.output<typeof cancelSchema>) {
  const b = await getBookingFor(viewer, idOrRef);
  assertCanChange(b, viewer);
  if (b.status === 'in_progress' && !canManage(viewer)) {
    throw errors.conflict('This job has already started. Please call us to cancel.');
  }
  assertTransition(b.status, 'cancelled');
  // TODO (payments): apply the cancellation policy and refund once README 13 is decided.
  await db.booking.update({
    where: { id: b.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: input.reason,
      events: { create: { type: 'cancelled', actorId: viewer.id, payload: { reason: input.reason ?? null, previousStatus: b.status } } },
    },
  });
  return reload(viewer, b.id);
}

// ─── Admin / dispatch ───────────────────────────────────────────────────────

async function assertProviderFits(providerId: string, b: DetailBooking) {
  const provider = await db.provider.findUnique({ where: { id: providerId }, include: { serviceAreas: true } });
  if (!provider?.active) throw errors.validation('Pick an active provider', { providerId: 'Not an active provider' });
  if (!provider.services.includes(b.serviceType)) {
    throw errors.validation(`${provider.displayName} doesn't offer ${SERVICE_LABELS[b.serviceType]}`, { providerId: 'Wrong service' });
  }
  if (!provider.serviceAreas.some((a) => a.active && a.zips.includes(b.originAddress.zip))) {
    throw errors.validation(`${provider.displayName} doesn't cover ZIP ${b.originAddress.zip}`, { providerId: 'Outside their area' });
  }
  return provider;
}

// Serializes assign/confirm on one booking, so two dispatchers can't leave the booking and its
// conversation pointing at different providers.
async function lockBooking(tx: Prisma.TransactionClient, id: string) {
  const [row] = await tx.$queryRaw<{ provider_id: string | null }[]>`SELECT provider_id FROM bookings WHERE id = ${id}::uuid FOR UPDATE`;
  return row?.provider_id ?? null;
}

export async function adminConfirm(viewer: Viewer, idOrRef: string, input: z.output<typeof adminConfirmSchema>) {
  const b = await getBookingFor(viewer, idOrRef);
  assertTransition(b.status, 'confirmed');
  const provider = await assertProviderFits(input.providerId, b);
  // Both events are written in one statement; explicit times keep them in order on the timeline.
  const now = Date.now();
  const events: Prisma.BookingEventCreateWithoutBookingInput[] = [];
  if (b.providerId !== input.providerId) {
    events.push({ type: 'provider_assigned', createdAt: new Date(now), actor: { connect: { id: viewer.id } }, payload: { providerId: input.providerId } });
  }
  events.push({
    type: 'confirmed',
    createdAt: new Date(now + 1),
    actor: { connect: { id: viewer.id } },
    payload: { windowStart: input.windowStart, windowEnd: input.windowEnd, finalPriceCents: input.finalPriceCents ?? null },
  });
  await db.$transaction(async (tx) => {
    if ((await lockBooking(tx, b.id)) !== b.providerId) throw errors.conflict('This booking was just changed by someone else. Please reload.');
    await tx.booking.update({
      where: { id: b.id },
      data: {
        status: 'confirmed',
        provider: { connect: { id: input.providerId } },
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
        ...(input.finalPriceCents !== undefined ? { finalPriceCents: input.finalPriceCents } : {}),
        ...(input.estimatedDurationMin !== undefined ? { estimatedDurationMin: input.estimatedDurationMin } : {}),
        events: { create: events },
      },
    });
    // The assigned pro becomes the conversation's moderator (replacing any previous one).
    await setConversationModerator(tx, b, provider);
  });
  return reload(viewer, b.id);
}

export async function adminAssign(viewer: Viewer, idOrRef: string, providerId: string) {
  const b = await getBookingFor(viewer, idOrRef);
  if (!OPEN_STATUSES.includes(b.status)) throw errors.conflict(`Can't assign a provider to a ${b.status.replace('_', ' ')} booking`);
  if (b.providerId === providerId) throw errors.conflict('That provider is already assigned');
  const provider = await assertProviderFits(providerId, b);
  await db.$transaction(async (tx) => {
    if ((await lockBooking(tx, b.id)) !== b.providerId) throw errors.conflict('This booking was just changed by someone else. Please reload.');
    await tx.booking.update({
      where: { id: b.id },
      data: {
        provider: { connect: { id: providerId } },
        events: { create: { type: 'provider_assigned', actorId: viewer.id, payload: { providerId, previousProviderId: b.providerId } } },
      },
    });
    // The new pro replaces the old one as the conversation's moderator.
    await setConversationModerator(tx, b, provider);
  });
  return reload(viewer, b.id);
}

export async function adminSetStatus(viewer: Viewer, idOrRef: string, status: 'in_progress' | 'completed') {
  const b = await getBookingFor(viewer, idOrRef);
  assertTransition(b.status, status);
  if (!b.providerId) throw errors.conflict('Assign a provider first');
  await db.booking.update({
    where: { id: b.id },
    data: { status, events: { create: { type: status === 'in_progress' ? 'started' : 'completed', actorId: viewer.id } } },
  });
  return reload(viewer, b.id);
}
