import type { BookingStatus } from '@/generated/prisma/client';
import { errors } from '@/app/lib/server/http';

// Allowed status changes (README 6). Anything else is a 409.
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pending', 'in_progress', 'cancelled'], // back to pending after a reschedule
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!TRANSITIONS[from].includes(to)) {
    throw errors.conflict(`A ${from.replace('_', ' ')} booking can't be moved to ${to.replace('_', ' ')}`);
  }
}

export const OPEN_STATUSES: BookingStatus[] = ['pending', 'confirmed'];
export const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress']; // hold capacity

/** Customers can change details only this long before the arrival window (README 6). */
export const MODIFY_CUTOFF_MS = 24 * 60 * 60 * 1000;
