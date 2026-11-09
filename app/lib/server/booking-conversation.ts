import { SERVICE_LABELS } from '@/app/lib/catalog';
import { fromDbDate, slotLabel } from '@/app/lib/server/time';
import type { Prisma, ServiceType } from '@/generated/prisma/client';

// The conversation that comes with every booking (README 8.7). Kept apart from messaging.ts so
// bookings.ts can call it inside its own transactions without importing the messaging queries.

interface BookingForThread {
  id: string;
  ref: string;
  customerId: string;
  serviceType: ServiceType;
  scheduledDate: Date;
  preferredSlot: string;
}

function dayLabel(d: Date) {
  return new Date(`${fromDbDate(d)}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function welcomeMessage(b: BookingForThread, customerName: string) {
  const first = customerName.trim().split(/\s+/)[0];
  return [
    `Hi${first ? ` ${first}` : ''}, thanks for booking ${SERVICE_LABELS[b.serviceType]} with MoveNow!`,
    `We've received your request ${b.ref} for ${dayLabel(b.scheduledDate)} around ${slotLabel(b.preferredSlot)}. Our team will confirm your arrival window and match you with a pro shortly.`,
    'Reply here any time with questions. Your pro will join this conversation once they are assigned.',
  ].join('\n\n');
}

/**
 * Opens a booking's conversation between the customer and MoveNow support, with an automated
 * welcome message from support (senderId null). Call inside the transaction that creates the booking.
 */
export async function openBookingConversation(tx: Prisma.TransactionClient, b: BookingForThread, customerName: string, at = new Date()) {
  return tx.conversation.create({
    data: {
      bookingId: b.id,
      customerId: b.customerId,
      lastMessageAt: at,
      createdAt: at,
      messages: { create: { author: 'support', senderId: null, body: welcomeMessage(b, customerName), createdAt: at } },
    },
  });
}

/**
 * Makes the booking's assigned provider the moderator of its conversation, replacing the previous
 * one, and tells the customer in the thread. Creates the conversation first for bookings made
 * before conversations were opened automatically. Call inside the assigning transaction.
 *
 * The new moderator's read pointer starts now, so the history before they joined isn't unread for them.
 */
export async function setConversationModerator(
  tx: Prisma.TransactionClient,
  b: BookingForThread & { customer: { fullName: string } },
  provider: { id: string; displayName: string },
) {
  const now = new Date();
  let conversation = await tx.conversation.findUnique({ where: { bookingId: b.id } });
  if (!conversation) conversation = await openBookingConversation(tx, b, b.customer.fullName, new Date(now.getTime() - 1));
  if (conversation.providerId === provider.id) return conversation;

  const body = conversation.providerId
    ? `${provider.displayName} is now your pro for this job and has taken over this conversation as moderator.`
    : `${provider.displayName} has been assigned as your pro and joins this conversation as moderator.`;
  return tx.conversation.update({
    where: { id: conversation.id },
    data: {
      providerId: provider.id,
      moderatorAssignedAt: now,
      moderatorReadAt: now,
      lastMessageAt: now,
      messages: { create: { author: 'support', senderId: null, body, createdAt: now } },
    },
  });
}
