import { SERVICE_LABELS } from '@/app/lib/catalog';
import { openBookingConversation } from '@/app/lib/server/booking-conversation';
import { getBookingFor, type Viewer } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { appUrl, sendEmail } from '@/app/lib/server/email';
import { errors, isUuid } from '@/app/lib/server/http';
import { fromDbDate } from '@/app/lib/server/time';
import { can } from '@/app/lib/staff';
import type { listConversationsQuery, listMessagesQuery } from '@/app/lib/validation/messaging';
import { Prisma, type MessageAuthor } from '@/generated/prisma/client';
import type { z } from 'zod';

// Messaging (README 7.9 / 8.7). One conversation per booking, opened when the booking is created
// (booking-conversation.ts). Each conversation has up to three seats:
//
//   customer  → the booking's customer
//   support   → MoveNow staff with support.reply. Always present; the team shares one seat.
//   moderator → the booking's assigned provider. Joins on assignment; a reassignment replaces them,
//               and the previous provider loses access to the thread.
//
// What each seat may do (enforced here, not just hidden in the UI):
//   read, mark read           → every seat
//   post                      → support and moderator always; customer unless the thread is closed
//   close / reopen the thread → support and moderator
//   hide a message            → support (any message), moderator (customer's and their own, not support's)
//
// Each seat has its own read pointer (customerReadAt / supportReadAt / moderatorReadAt), so one
// side reading never clears another side's unread badge.

export const SUPPORT_NAME = 'MoveNow Support';
const PREVIEW_LENGTH = 120;
const HIDDEN_BODY = 'This message was removed by a moderator.';
// Recipients active in the app within this window see the badge; no email needed.
const ONLINE_WINDOW_MS = 5 * 60_000;

export type Seat = MessageAuthor; // 'customer' | 'support' | 'moderator'

/** The seat a viewer holds in every conversation they can see. Null = no messaging access. */
export function seatOf(viewer: Viewer): Seat | null {
  if (viewer.role === 'admin') return can(viewer, 'support.reply') ? 'support' : null;
  if (viewer.role === 'provider') return 'moderator';
  return 'customer';
}

function scopeWhere(viewer: Viewer): Prisma.ConversationWhereInput {
  const seat = seatOf(viewer);
  if (seat === 'support') return {};
  if (seat === 'moderator') return { provider: { userId: viewer.id } };
  if (seat === 'customer') return { customerId: viewer.id };
  return { id: { in: [] } }; // staff without support.reply see no threads
}

/** Same scope as scopeWhere, as SQL on the alias `c`, for the unread queries. */
function scopeSql(viewer: Viewer) {
  const seat = seatOf(viewer);
  if (seat === 'support') return Prisma.sql`TRUE`;
  if (seat === 'moderator') return Prisma.sql`c.provider_id IN (SELECT id FROM providers WHERE user_id = ${viewer.id}::uuid)`;
  if (seat === 'customer') return Prisma.sql`c.customer_id = ${viewer.id}::uuid`;
  return Prisma.sql`FALSE`;
}

const READ_COLUMN = { customer: 'customer_read_at', support: 'support_read_at', moderator: 'moderator_read_at' } as const;
const READ_FIELD = { customer: 'customerReadAt', support: 'supportReadAt', moderator: 'moderatorReadAt' } as const;

/** Unread = visible messages from another seat, newer than this seat's read pointer. */
async function unreadBy(viewer: Viewer, where: Prisma.Sql) {
  const seat = seatOf(viewer);
  if (!seat) return new Map<string, number>();
  const rows = await db.$queryRaw<{ id: string; unread: number }[]>`
    SELECT c.id, COUNT(m.id)::int AS unread
    FROM conversations c
    JOIN messages m ON m.conversation_id = c.id
    WHERE ${scopeSql(viewer)} AND ${where}
      AND m.author <> ${seat}::"MessageAuthor"
      AND m.hidden_at IS NULL
      AND m.created_at > COALESCE(c.${Prisma.raw(READ_COLUMN[seat])}, '-infinity'::timestamp)
    GROUP BY c.id`;
  return new Map(rows.map((r) => [r.id, r.unread]));
}

const conversationInclude = {
  provider: true,
  customer: { select: { fullName: true, avatarUrl: true } },
  booking: { select: { id: true, ref: true, serviceType: true, status: true, scheduledDate: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;
type ReadPointers = Pick<ConversationRow, 'customerReadAt' | 'supportReadAt' | 'moderatorReadAt'>;

const messageInclude = { sender: { select: { fullName: true } } } satisfies Prisma.MessageInclude;
type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

// ─── Permissions ────────────────────────────────────────────────────────────

function permissionsFor(c: { closedAt: Date | null }, seat: Seat) {
  const moderates = seat === 'support' || seat === 'moderator';
  return {
    canPost: moderates || !c.closedAt,
    canModerate: moderates, // close / reopen, hide messages
  };
}

function assertCanHide(seat: Seat, author: Seat) {
  if (seat === 'support') return;
  if (seat === 'moderator' && author !== 'support') return;
  throw errors.forbidden(seat === 'moderator' ? "Moderators can't remove messages from MoveNow Support" : 'Only the moderator or support can remove messages');
}

// ─── Serialization ──────────────────────────────────────────────────────────

type Party =
  | { kind: 'provider'; name: string; avatarUrl: string | null; avatarAlt: string | null }
  | { kind: 'support'; name: string; avatarUrl: null; avatarAlt: null }
  | { kind: 'customer'; name: string; avatarUrl: string | null; avatarAlt: null };

const supportParty: Party = { kind: 'support', name: SUPPORT_NAME, avatarUrl: null, avatarAlt: null };
const moderatorParty = (c: ConversationRow): Party | null =>
  c.provider ? { kind: 'provider', name: c.provider.displayName, avatarUrl: c.provider.avatarUrl, avatarAlt: c.provider.avatarAlt } : null;
const customerParty = (c: ConversationRow): Party => ({ kind: 'customer', name: c.customer.fullName, avatarUrl: c.customer.avatarUrl, avatarAlt: null });

function preview(body: string) {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

export function serializeConversation(c: ConversationRow, viewer: Viewer, unreadCount = 0) {
  const seat = seatOf(viewer) ?? 'customer';
  const last = c.messages[0];
  return {
    id: c.id,
    seat,
    // Who the viewer is talking to: the customer sees their pro (or support until one is assigned);
    // the pro and support see the customer.
    otherParty: seat === 'customer' ? (moderatorParty(c) ?? supportParty) : customerParty(c),
    participants: [customerParty(c), supportParty, ...(c.provider ? [{ ...moderatorParty(c)!, moderator: true }] : [])],
    moderator: c.provider ? { id: c.provider.id, name: c.provider.displayName, since: c.moderatorAssignedAt?.toISOString() ?? null } : null,
    closedAt: c.closedAt?.toISOString() ?? null,
    permissions: permissionsFor(c, seat),
    lastMessagePreview: last ? (last.hiddenAt ? HIDDEN_BODY : preview(last.body)) : null,
    lastMessageMine: last ? last.senderId === viewer.id : false,
    lastMessageAt: (last?.createdAt ?? c.lastMessageAt).toISOString(),
    unreadCount,
    booking: c.booking
      ? {
          id: c.booking.id,
          ref: c.booking.ref,
          serviceType: c.booking.serviceType,
          serviceLabel: SERVICE_LABELS[c.booking.serviceType],
          status: c.booking.status,
          scheduledDate: fromDbDate(c.booking.scheduledDate),
        }
      : null,
    // Also at the top level, as README 7.9 lists it.
    bookingRef: c.booking?.ref ?? null,
  };
}

/** When another seat has read past the message ("Seen"): the customer for staff/pro messages, support or the pro for the customer's. */
function seenAt(m: MessageRow, c: ReadPointers): string | null {
  const pointers = m.author === 'customer' ? [c.supportReadAt, c.moderatorReadAt] : [c.customerReadAt];
  const seen = pointers.filter((p): p is Date => !!p && p >= m.createdAt).sort((a, b) => b.getTime() - a.getTime())[0];
  return seen?.toISOString() ?? null;
}

export function serializeMessage(m: MessageRow, viewer: Viewer, c: ReadPointers & { provider: { displayName: string } | null }) {
  const kind = m.author === 'moderator' ? ('provider' as const) : m.author;
  const name =
    m.author === 'support'
      ? SUPPORT_NAME
      : m.author === 'moderator'
        ? (m.sender?.fullName ?? c.provider?.displayName ?? 'Former pro')
        : (m.sender?.fullName ?? 'Former user');
  return {
    id: m.id,
    body: m.hiddenAt ? HIDDEN_BODY : m.body,
    hidden: !!m.hiddenAt,
    automated: m.author === 'support' && !m.senderId,
    createdAt: m.createdAt.toISOString(),
    readAt: seenAt(m, c),
    mine: !!m.senderId && m.senderId === viewer.id,
    sender: { kind, name, moderator: m.author === 'moderator' },
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

/** 404 (not 403) when the viewer isn't in the conversation, so ids can't be probed. */
async function findConversationFor(viewer: Viewer, id: string) {
  const seat = seatOf(viewer);
  if (!isUuid(id) || !seat) throw errors.notFound('Conversation');
  const c = await db.conversation.findFirst({ where: { AND: [scopeWhere(viewer), { id }] }, include: conversationInclude });
  if (!c) throw errors.notFound('Conversation');
  return { c, seat };
}

export async function getConversation(viewer: Viewer, id: string) {
  const { c } = await findConversationFor(viewer, id);
  const unread = await unreadBy(viewer, Prisma.sql`c.id = ${c.id}::uuid`);
  return serializeConversation(c, viewer, unread.get(c.id) ?? 0);
}

/** Conversations with at least one message, newest activity first. Powers /messages and Recent Messages. */
export async function listConversations(viewer: Viewer, query: z.output<typeof listConversationsQuery>) {
  const rows = await db.conversation.findMany({
    where: { AND: [scopeWhere(viewer), { messages: { some: {} } }] },
    include: conversationInclude,
    orderBy: { lastMessageAt: 'desc' },
    take: query.limit,
  });
  const unread = rows.length ? await unreadBy(viewer, Prisma.sql`c.id IN (${Prisma.join(rows.map((r) => Prisma.sql`${r.id}::uuid`))})`) : new Map();
  return { items: rows.map((c) => serializeConversation(c, viewer, unread.get(c.id) ?? 0)) };
}

export async function unreadCount(viewer: Viewer) {
  const unread = await unreadBy(viewer, Prisma.sql`TRUE`);
  return { count: [...unread.values()].reduce((a, b) => a + b, 0) };
}

/**
 * "Message" on a booking: returns its conversation. Bookings made before conversations opened
 * automatically get one now, with the booking's provider (if any) as moderator.
 */
export async function startConversation(viewer: Viewer, bookingIdOrRef: string) {
  const b = await getBookingFor(viewer, bookingIdOrRef);
  if (!seatOf(viewer)) throw errors.notFound('Booking');

  let created = false;
  let conversation = await db.conversation.findUnique({ where: { bookingId: b.id } });
  if (!conversation) {
    try {
      conversation = await db.$transaction(async (tx) => {
        const opened = await openBookingConversation(tx, b, b.customer.fullName);
        if (!b.providerId) return opened;
        return tx.conversation.update({ where: { id: opened.id }, data: { providerId: b.providerId, moderatorAssignedAt: new Date() } });
      });
      created = true;
    } catch (e) {
      // Two tabs clicked at once: the other request created it.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      conversation = await db.conversation.findUniqueOrThrow({ where: { bookingId: b.id } });
    }
  }
  return { conversation: await getConversation(viewer, conversation.id), created };
}

/**
 * Messages oldest → newest. `before` pages back through history; `after` returns only newer
 * messages (polling). With neither, returns the latest `limit`.
 */
export async function listMessages(viewer: Viewer, conversationId: string, query: z.output<typeof listMessagesQuery>) {
  const { c } = await findConversationFor(viewer, conversationId);
  if (query.after) {
    // gte + client-side de-dupe by id: two messages can share a millisecond.
    const rows = await db.message.findMany({
      where: { conversationId: c.id, createdAt: { gte: new Date(query.after) } },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
      take: query.limit,
    });
    return { items: rows.map((m) => serializeMessage(m, viewer, c)), hasMore: false };
  }
  const rows = await db.message.findMany({
    where: { conversationId: c.id, ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}) },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: query.limit + 1,
  });
  const hasMore = rows.length > query.limit;
  return { items: rows.slice(0, query.limit).reverse().map((m) => serializeMessage(m, viewer, c)), hasMore };
}

export async function sendMessage(viewer: Viewer, conversationId: string, body: string) {
  const { c, seat } = await findConversationFor(viewer, conversationId);
  if (!permissionsFor(c, seat).canPost) throw errors.forbidden('This conversation was closed by the moderator. Please contact support.');
  const now = new Date();
  const [message, updated] = await db.$transaction([
    db.message.create({ data: { conversationId: c.id, senderId: viewer.id, author: seat, body, createdAt: now }, include: messageInclude }),
    // Replying means you've seen the thread.
    db.conversation.update({ where: { id: c.id }, data: { lastMessageAt: now, [READ_FIELD[seat]]: now }, include: conversationInclude }),
  ]);
  notifyRecipients(updated, seat, message).catch((e) => console.error('[messaging] notification failed', e));
  return serializeMessage(message, viewer, updated);
}

/** Moves the viewer's seat read pointer to now. Returns how many messages that cleared. */
export async function markRead(viewer: Viewer, conversationId: string) {
  const { c, seat } = await findConversationFor(viewer, conversationId);
  const marked = (await unreadBy(viewer, Prisma.sql`c.id = ${c.id}::uuid`)).get(c.id) ?? 0;
  if (marked > 0) await db.conversation.update({ where: { id: c.id }, data: { [READ_FIELD[seat]]: new Date() } });
  return { marked };
}

// ─── Moderation ─────────────────────────────────────────────────────────────

/** Close (customer can't post) or reopen a conversation. Moderator or support only. */
export async function setConversationClosed(viewer: Viewer, conversationId: string, closed: boolean) {
  const { c, seat } = await findConversationFor(viewer, conversationId);
  if (!permissionsFor(c, seat).canModerate) throw errors.forbidden('Only the moderator or support can close this conversation');
  if (!!c.closedAt !== closed) {
    await db.conversation.update({
      where: { id: c.id },
      data: closed ? { closedAt: new Date(), closedById: viewer.id } : { closedAt: null, closedById: null },
    });
  }
  return getConversation(viewer, c.id);
}

/** Hide a message's text from everyone (kept in the database for disputes). */
export async function hideMessage(viewer: Viewer, conversationId: string, messageId: string) {
  const { c, seat } = await findConversationFor(viewer, conversationId);
  if (!isUuid(messageId)) throw errors.notFound('Message');
  const m = await db.message.findFirst({ where: { id: messageId, conversationId: c.id } });
  if (!m) throw errors.notFound('Message');
  assertCanHide(seat, m.author);
  const updated = m.hiddenAt
    ? await db.message.findUniqueOrThrow({ where: { id: m.id }, include: messageInclude })
    : await db.message.update({ where: { id: m.id }, data: { hiddenAt: new Date(), hiddenById: viewer.id }, include: messageInclude });
  return serializeMessage(updated, viewer, c);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

/** Support inbox badge for the admin overview: customer messages support hasn't read yet. */
export async function supportUnreadCount() {
  const [{ count }] = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(m.id)::int AS count
    FROM conversations c JOIN messages m ON m.conversation_id = c.id
    WHERE m.author = 'customer' AND m.hidden_at IS NULL
      AND m.created_at > COALESCE(c.support_read_at, '-infinity'::timestamp)`;
  return count;
}

// ─── Notifications ──────────────────────────────────────────────────────────

// Email the recipient when they're offline and `notify_messages` is on (README 8.7). Only the
// first unread message of a burst triggers an email, so a back-and-forth doesn't flood the inbox.
// The customer's messages go to the moderator (support watches the inbox instead); support's and
// the moderator's go to the customer.
async function notifyRecipients(c: ConversationRow, from: Seat, message: MessageRow) {
  const recipientId = from === 'customer' ? c.provider?.userId : c.customerId;
  const recipientSeat: Seat = from === 'customer' ? 'moderator' : 'customer';
  if (!recipientId) return;

  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    include: { preferences: true, sessions: { orderBy: { lastUsedAt: 'desc' }, take: 1 } },
  });
  if (!recipient || recipient.deletedAt || recipient.preferences?.notifyMessages === false) return;
  const lastSeen = recipient.sessions[0]?.lastUsedAt.getTime() ?? 0;
  if (Date.now() - lastSeen < ONLINE_WINDOW_MS) return;

  const readAt = c[READ_FIELD[recipientSeat]];
  const earlierUnread = await db.message.count({
    where: { conversationId: c.id, author: { not: recipientSeat }, NOT: { id: message.id }, ...(readAt ? { createdAt: { gt: readAt } } : {}) },
  });
  if (earlierUnread > 0) return;

  const fromName = serializeMessage(message, { id: '', role: 'customer' }, c).sender.name;
  const about = c.booking ? ` about ${SERVICE_LABELS[c.booking.serviceType]} (${c.booking.ref})` : '';
  await sendEmail({
    to: recipient.email,
    subject: `New message from ${fromName}`,
    text: `${fromName} sent you a message${about}:\n\n"${preview(message.body)}"\n\nReply here: ${appUrl(`/messages/${c.id}`)}\n\nYou can turn off message emails in Profile & Settings → Notifications.`,
  });
}
