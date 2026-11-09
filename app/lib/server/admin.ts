import { SERVICE_LABELS, type ServiceTypeId } from '@/app/lib/catalog';
import { getBookingFor, serializeDetail, serializeListItem, serializeProvider, type Viewer } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { appUrl, sendEmail } from '@/app/lib/server/email';
import { errors, isUuid, paginate } from '@/app/lib/server/http';
import { ACTIVE_STATUSES } from '@/app/lib/server/lifecycle';
import { supportUnreadCount } from '@/app/lib/server/messaging';
import { addDays, fromDbDate, toDbDate, todayInFlorida } from '@/app/lib/server/time';
import { permissionsOf } from '@/app/lib/staff';
import type {
  adminBookingsQuery,
  auditQuery,
  blockCreateSchema,
  customersQuery,
  providerInputSchema,
  providersQuery,
  providerUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
} from '@/app/lib/validation/admin';
import type { Prisma, StaffRole } from '@/generated/prisma/client';
import type { z } from 'zod';

// Data for the /admin pages. Every function here is called from a route that has already checked
// the staff permission (requirePermission), so these don't repeat the check.

const listInclude = {
  originAddress: true,
  destinationAddress: true,
  provider: true,
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.BookingInclude;

type AdminListBooking = Prisma.BookingGetPayload<{ include: typeof listInclude }>;

function serializeAdminBooking(b: AdminListBooking) {
  return {
    ...serializeListItem(b),
    customer: { id: b.customer.id, name: b.customer.fullName || b.customer.email, email: b.customer.email },
    needsAction: b.status === 'pending',
  };
}

// ─── Overview ───────────────────────────────────────────────────────────────

export async function overview() {
  const today = todayInFlorida();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [pending, unassigned, todayJobs, inProgress, supportUnread, newCustomers, queue, todayList] = await Promise.all([
    db.booking.count({ where: { status: 'pending' } }),
    db.booking.count({ where: { status: { in: ['pending', 'confirmed'] }, providerId: null } }),
    db.booking.count({ where: { scheduledDate: toDbDate(today), status: { in: ACTIVE_STATUSES } } }),
    db.booking.count({ where: { status: 'in_progress' } }),
    supportUnreadCount(),
    db.user.count({ where: { role: 'customer', deletedAt: null, createdAt: { gte: weekAgo } } }),
    db.booking.findMany({ where: { status: 'pending' }, include: listInclude, orderBy: { createdAt: 'asc' }, take: 6 }),
    db.booking.findMany({
      where: { scheduledDate: toDbDate(today), status: { in: ACTIVE_STATUSES } },
      include: listInclude,
      orderBy: [{ windowStart: 'asc' }, { preferredSlot: 'asc' }],
      take: 10,
    }),
  ]);
  return {
    today,
    counts: { pending, unassigned, todayJobs, inProgress, supportUnread, newCustomers },
    queue: queue.map(serializeAdminBooking),
    schedule: todayList.map(serializeAdminBooking),
  };
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function listAdminBookings(query: z.output<typeof adminBookingsQuery>) {
  const q = query.q;
  const contains = q ? { contains: q, mode: 'insensitive' as const } : undefined;
  const where: Prisma.BookingWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.service ? { serviceType: query.service } : {}),
    ...(query.unassigned ? { providerId: null, status: { in: ['pending', 'confirmed'] } } : {}),
    ...(query.from || query.to
      ? { scheduledDate: { ...(query.from ? { gte: toDbDate(query.from) } : {}), ...(query.to ? { lte: toDbDate(query.to) } : {}) } }
      : {}),
    ...(contains
      ? {
          OR: [
            { ref: contains },
            { customer: { fullName: contains } },
            { customer: { email: contains } },
            { originAddress: { street: contains } },
            { originAddress: { zip: { startsWith: q } } },
            { provider: { displayName: contains } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.BookingOrderByWithRelationInput[] =
    query.sort === 'scheduled_asc'
      ? [{ scheduledDate: 'asc' }, { preferredSlot: 'asc' }]
      : query.sort === 'scheduled_desc'
        ? [{ scheduledDate: 'desc' }, { preferredSlot: 'desc' }]
        : query.sort === 'created_asc'
          ? [{ createdAt: 'asc' }]
          : [{ createdAt: 'desc' }];
  const [total, rows] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({ where, include: listInclude, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { items: rows.map(serializeAdminBooking), ...paginate(query.page, query.pageSize, total) };
}

/** Booking detail plus who can take it, the customer, and its audit trail. */
export async function getAdminBooking(viewer: Viewer, idOrRef: string) {
  const b = await getBookingFor(viewer, idOrRef);
  const [customer, candidates, history] = await Promise.all([
    db.user.findUnique({ where: { id: b.customerId }, select: { id: true, fullName: true, email: true, phone: true, createdAt: true } }),
    providerCandidates(b.serviceType, b.originAddress.zip, fromDbDate(b.scheduledDate), b.id),
    db.auditLog.findMany({
      where: { targetType: 'booking', targetId: b.id },
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  return {
    booking: serializeDetail(b, viewer),
    customer: customer && { ...customer, createdAt: customer.createdAt.toISOString() },
    candidates,
    history: history.map(serializeAudit),
  };
}

/** Active providers who offer the service in an area covering the ZIP, with their jobs that day. */
async function providerCandidates(service: ServiceTypeId, zip: string, date: string, excludeBookingId: string) {
  const areas = await db.serviceArea.findMany({ where: { active: true, zips: { has: zip } }, select: { id: true } });
  if (areas.length === 0) return [];
  const providers = await db.provider.findMany({
    where: { active: true, services: { has: service }, serviceAreas: { some: { id: { in: areas.map((a) => a.id) } } } },
    include: {
      bookings: {
        where: { scheduledDate: toDbDate(date), status: { in: ACTIVE_STATUSES }, NOT: { id: excludeBookingId } },
        select: { ref: true, windowStart: true, windowEnd: true, preferredSlot: true, estimatedDurationMin: true },
      },
    },
    orderBy: [{ ratingAvg: 'desc' }, { displayName: 'asc' }],
  });
  return providers.map((p) => ({
    ...serializeProvider(p, { includePhone: true }),
    jobsThatDay: p.bookings.map((j) => ({ ref: j.ref, start: j.windowStart ?? j.preferredSlot, end: j.windowEnd, durationMin: j.estimatedDurationMin })),
  }));
}

// ─── Providers ──────────────────────────────────────────────────────────────

const providerInclude = {
  serviceAreas: { select: { id: true, name: true } },
  user: { select: { email: true } },
  _count: { select: { bookings: { where: { status: { in: ACTIVE_STATUSES } } } } },
} satisfies Prisma.ProviderInclude;

type AdminProvider = Prisma.ProviderGetPayload<{ include: typeof providerInclude }>;

function serializeAdminProvider(p: AdminProvider) {
  return {
    ...serializeProvider(p, { includePhone: true }),
    services: p.services,
    serviceLabels: p.services.map((s) => SERVICE_LABELS[s]),
    areas: p.serviceAreas,
    email: p.user?.email ?? null,
    active: p.active,
    openJobs: p._count.bookings,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function listAdminProviders(query: z.output<typeof providersQuery>) {
  const rows = await db.provider.findMany({
    where: {
      ...(query.q ? { displayName: { contains: query.q, mode: 'insensitive' } } : {}),
      ...(query.service ? { services: { has: query.service } } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    },
    include: providerInclude,
    orderBy: [{ active: 'desc' }, { displayName: 'asc' }],
  });
  const areas = await db.serviceArea.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  return { items: rows.map(serializeAdminProvider), areas };
}

async function assertAreas(ids: string[] | undefined) {
  if (!ids) return;
  const found = await db.serviceArea.count({ where: { id: { in: ids } } });
  if (found !== new Set(ids).size) throw errors.validation('Unknown service area', { areaIds: 'Unknown service area' });
}

export async function createProvider(input: z.output<typeof providerInputSchema>) {
  await assertAreas(input.areaIds);
  const { areaIds, ...data } = input;
  const p = await db.provider.create({
    data: { ...data, phone: data.phone ?? null, avatarUrl: data.avatarUrl ?? null, serviceAreas: { connect: areaIds.map((id) => ({ id })) } },
    include: providerInclude,
  });
  return serializeAdminProvider(p);
}

export async function updateProvider(id: string, input: z.output<typeof providerUpdateSchema>) {
  if (!isUuid(id)) throw errors.notFound('Provider');
  const before = await db.provider.findUnique({ where: { id } });
  if (!before) throw errors.notFound('Provider');
  await assertAreas(input.areaIds);
  const { areaIds, ...data } = input;
  const p = await db.provider.update({
    where: { id },
    data: { ...data, ...(areaIds ? { serviceAreas: { set: areaIds.map((a) => ({ id: a })) } } : {}) },
    include: providerInclude,
  });
  return { provider: serializeAdminProvider(p), before };
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function listCustomers(query: z.output<typeof customersQuery>) {
  const contains = query.q ? { contains: query.q, mode: 'insensitive' as const } : undefined;
  const where: Prisma.UserWhereInput = {
    role: 'customer',
    deletedAt: null,
    ...(contains ? { OR: [{ fullName: contains }, { email: contains }, { phone: { contains: query.q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { _count: { select: { bookings: true } }, bookings: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return {
    items: rows.map((u) => ({
      id: u.id,
      name: u.fullName || u.email,
      email: u.email,
      phone: u.phone,
      emailVerified: !!u.emailVerifiedAt,
      disabled: !!u.disabledAt,
      bookingCount: u._count.bookings,
      lastBookingAt: u.bookings[0]?.createdAt.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    ...paginate(query.page, query.pageSize, total),
  };
}

export async function getCustomer(id: string) {
  if (!isUuid(id)) throw errors.notFound('Customer');
  const u = await db.user.findFirst({
    where: { id, role: 'customer' },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      bookings: { include: listInclude, orderBy: { scheduledDate: 'desc' }, take: 50 },
    },
  });
  if (!u) throw errors.notFound('Customer');
  return {
    customer: {
      id: u.id,
      name: u.fullName || u.email,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      emailVerified: !!u.emailVerifiedAt,
      deleted: !!u.deletedAt,
      createdAt: u.createdAt.toISOString(),
    },
    addresses: u.addresses.map((a) => ({ id: a.id, label: a.label, formatted: [a.street, a.apt, a.city, a.state, a.zip].filter(Boolean).join(', ') })),
    bookings: u.bookings.map(serializeAdminBooking),
  };
}

// ─── Staff ──────────────────────────────────────────────────────────────────

const serializeStaff = (u: { id: string; email: string; fullName: string; staffRole: StaffRole | null; disabledAt: Date | null; passwordHash: string | null; createdAt: Date; role: 'admin' | 'customer' | 'provider' }) => ({
  id: u.id,
  email: u.email,
  name: u.fullName || u.email,
  staffRole: u.staffRole,
  permissions: permissionsOf(u),
  disabled: !!u.disabledAt,
  invited: !u.passwordHash, // hasn't set a password yet
  createdAt: u.createdAt.toISOString(),
});

export async function listStaff() {
  const rows = await db.user.findMany({ where: { role: 'admin', deletedAt: null }, orderBy: [{ disabledAt: 'asc' }, { fullName: 'asc' }] });
  const sessions = await db.session.groupBy({ by: ['userId'], where: { userId: { in: rows.map((r) => r.id) }, expiresAt: { gt: new Date() } }, _max: { lastUsedAt: true } });
  const lastSeen = new Map(sessions.map((s) => [s.userId, s._max.lastUsedAt?.toISOString() ?? null]));
  return { items: rows.map((u) => ({ ...serializeStaff(u), lastActiveAt: lastSeen.get(u.id) ?? null })) };
}

/** Adds a staff account with no password; they choose one with "Forgot password" (an email code). */
export async function createStaff(input: z.output<typeof staffCreateSchema>) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw errors.conflict('That email already has an account. Use a different email for staff.');
  const u = await db.user.create({
    data: { email: input.email, fullName: input.fullName, role: 'admin', staffRole: input.staffRole, preferences: { create: {} } },
  });
  await sendEmail({
    to: u.email,
    subject: "You've been added to the MoveNow staff team",
    text: `Hi ${u.fullName},\n\nYou now have a MoveNow staff account (${input.staffRole}).\n\nTo set your password, open ${appUrl(`/signin?mode=forgot&email=${encodeURIComponent(u.email)}`)} and ask for a code. Every staff sign-in also asks for a code sent to this email.`,
  }).catch((e) => console.error('[admin] invite email failed', e));
  return serializeStaff(u);
}

export async function updateStaff(actorId: string, id: string, input: z.output<typeof staffUpdateSchema>) {
  if (!isUuid(id)) throw errors.notFound('Staff member');
  if (id === actorId) throw errors.conflict("You can't change your own role or access. Ask another manager.");
  const target = await db.user.findFirst({ where: { id, role: 'admin', deletedAt: null } });
  if (!target) throw errors.notFound('Staff member');

  const losesManager =
    target.staffRole === 'manager' && !target.disabledAt && (input.disabled === true || (input.staffRole && input.staffRole !== 'manager'));
  if (losesManager) {
    const managers = await db.user.count({ where: { role: 'admin', staffRole: 'manager', disabledAt: null, deletedAt: null } });
    if (managers <= 1) throw errors.conflict('There must always be at least one active manager');
  }

  const u = await db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(input.staffRole ? { staffRole: input.staffRole } : {}),
        ...(input.disabled !== undefined ? { disabledAt: input.disabled ? new Date() : null } : {}),
      },
    });
    // Access changes take effect now: signing them out means the next request sees the new role.
    await tx.session.deleteMany({ where: { userId: id } });
    return updated;
  });
  return { staff: serializeStaff(u), before: serializeStaff(target) };
}

// ─── Availability blocks ────────────────────────────────────────────────────

export async function listBlocks(from = todayInFlorida()) {
  const rows = await db.availabilityBlock.findMany({
    where: { date: { gte: toDbDate(from), lte: toDbDate(addDays(from, 180)) } },
    include: { area: { select: { name: true } } },
    orderBy: [{ date: 'asc' }, { slot: 'asc' }],
  });
  return {
    items: rows.map((b) => ({
      id: b.id,
      date: fromDbDate(b.date),
      slot: b.slot,
      serviceType: b.serviceType,
      serviceLabel: b.serviceType ? SERVICE_LABELS[b.serviceType] : null,
      areaId: b.areaId,
      areaName: b.area?.name ?? null,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

export async function createBlock(input: z.output<typeof blockCreateSchema>) {
  if (input.date < todayInFlorida()) throw errors.validation("Can't block a date in the past", { date: 'Pick today or later' });
  if (input.areaId && !(await db.serviceArea.findUnique({ where: { id: input.areaId } }))) throw errors.validation('Unknown service area');
  const b = await db.availabilityBlock.create({
    data: { date: toDbDate(input.date), slot: input.slot, serviceType: input.serviceType, areaId: input.areaId, reason: input.reason },
  });
  // Bookings already in that time aren't moved; dispatch sees them in the list.
  const affected = await db.booking.count({
    where: {
      scheduledDate: b.date,
      status: { in: ACTIVE_STATUSES },
      ...(input.serviceType ? { serviceType: input.serviceType } : {}),
      ...(input.slot ? { preferredSlot: input.slot } : {}),
    },
  });
  return { id: b.id, affectedBookings: affected };
}

export async function deleteBlock(id: string) {
  if (!isUuid(id)) throw errors.notFound('Block');
  const b = await db.availabilityBlock.findUnique({ where: { id } });
  if (!b) throw errors.notFound('Block');
  await db.availabilityBlock.delete({ where: { id } });
  return b;
}

// ─── Audit log ──────────────────────────────────────────────────────────────

type AuditRow = Prisma.AuditLogGetPayload<{ include: { actor: { select: { fullName: true; email: true } } } }>;

function serializeAudit(a: AuditRow) {
  return {
    id: a.id,
    action: a.action,
    targetType: a.targetType,
    targetId: a.targetId,
    summary: a.summary,
    metadata: a.metadata,
    actor: a.actor ? a.actor.fullName || a.actor.email : 'Deleted user',
    ip: a.ip,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listAudit(query: z.output<typeof auditQuery>) {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.targetId ? { targetId: query.targetId } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
  };
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { items: rows.map(serializeAudit), ...paginate(query.page, query.pageSize, total) };
}
