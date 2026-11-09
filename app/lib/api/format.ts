import { SERVICE_LABELS, type BookingStatusId } from '@/app/lib/catalog';
import type { ApiBooking } from '@/app/lib/api/types';
import type { BookingStatus, ServiceType } from '@/app/data/mockData';

// Turns API values into what the UI shows. Safe for client and server.

export const UI_STATUS: Record<BookingStatusId, BookingStatus> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const API_STATUS: Record<BookingStatus, BookingStatusId> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  'In progress': 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-08" → "Nov 8, 2026" (no time zone shift: it's a calendar date). */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? `${MONTHS[m - 1]} ${d}, ${y}` : '—';
}

/** ISO timestamp → "Nov 8, 2026 • 2:05 PM" in the viewer's time zone. */
export function formatDateTime(iso: string | null | undefined, timeZone = 'America/New_York') {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
  return `${date} • ${time}`;
}

/** "14:00" → "2:00 PM" */
export function timeLabel(hhmm: string | null | undefined) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function windowLabel(b: { windowStart: string | null; windowEnd: string | null; preferredSlot: string }) {
  if (b.windowStart && b.windowEnd) return `${timeLabel(b.windowStart)} - ${timeLabel(b.windowEnd)}`;
  return `${timeLabel(b.preferredSlot)} (requested)`;
}

export function durationLabel(min: number) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hour${h === 1 ? '' : 's'}`;
}

export function money(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return '—';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

// ─── Booking shape for the existing card components ─────────────────────────

export interface UiProvider {
  id: string;
  name: string;
  avatar: string | null;
  avatarAlt: string;
  rating: number;
  reviews: number;
  phone?: string | null;
}

export interface UiBooking {
  id: string;
  ref: string;
  service: ServiceType;
  status: BookingStatus;
  dateLabel: string;
  isoDate: string;
  timeWindow: string;
  address: string;
  duration: string;
  image: string;
  imageAlt: string;
  provider: UiProvider | null; // null until a pro is assigned
  priceLabel: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop';

export function toUiBooking(b: ApiBooking): UiBooking {
  const service = SERVICE_LABELS[b.serviceType] as ServiceType;
  return {
    id: b.id,
    ref: b.ref,
    service,
    status: UI_STATUS[b.status],
    dateLabel: formatDate(b.scheduledDate),
    isoDate: b.scheduledDate,
    timeWindow: windowLabel(b),
    address: b.address,
    duration: durationLabel(b.estimatedDurationMin),
    image: b.coverImageUrl ?? FALLBACK_IMAGE,
    imageAlt: `${service} booking at ${b.address}`,
    provider: b.provider
      ? {
          id: b.provider.id,
          name: b.provider.name,
          avatar: b.provider.avatarUrl,
          avatarAlt: b.provider.avatarAlt ?? b.provider.name,
          rating: b.provider.rating,
          reviews: b.provider.reviewCount,
          phone: 'phone' in b.provider ? (b.provider as { phone?: string | null }).phone : undefined,
        }
      : null,
    priceLabel: money(b.finalPriceCents ?? b.quotedPriceCents),
  };
}
