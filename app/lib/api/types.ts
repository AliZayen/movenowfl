// Response types for the /api/v1 endpoints, taken from the server serializers so they can't drift.
// `import type` only: none of the server code ends up in the browser bundle.
import type { serializeUser } from '@/app/lib/server/auth';
import type { serializeAddress } from '@/app/lib/server/addresses';
import type { bookingStats, serializeDetail, serializeListItem, serializeProvider } from '@/app/lib/server/bookings';
import type { getAvailability } from '@/app/lib/server/availability';
import type { Estimate } from '@/app/lib/server/pricing';
import type { serializeConversation, serializeMessage } from '@/app/lib/server/messaging';

export type ApiUser = ReturnType<typeof serializeUser>;
export type ApiAddress = ReturnType<typeof serializeAddress>;
export type ApiBooking = ReturnType<typeof serializeListItem>;
export type ApiBookingDetail = ReturnType<typeof serializeDetail>;
export type ApiProvider = ReturnType<typeof serializeProvider>;
export type ApiStats = Awaited<ReturnType<typeof bookingStats>>;
export type ApiAvailability = Awaited<ReturnType<typeof getAvailability>>;
export type ApiEstimate = Estimate & { area: string };
export type ApiConversation = ReturnType<typeof serializeConversation>;
export type ApiMessage = ReturnType<typeof serializeMessage>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiService {
  id: 'moving' | 'furniture_assembly' | 'tv_mounting';
  name: string;
  description: string;
  startingPriceCents: number;
  imageUrl: string;
  imageAlt: string;
}

export interface ApiServiceArea {
  id: string;
  name: string;
  zipCount: number;
}

export interface ZipCheck {
  zip: string;
  served: boolean;
  area: string | null;
  areas: string[];
}

// ─── Admin ──────────────────────────────────────────────────────────────────
type AdminServer = typeof import('@/app/lib/server/admin');
export type AdminOverview = Awaited<ReturnType<AdminServer['overview']>>;
export type AdminBookingList = Awaited<ReturnType<AdminServer['listAdminBookings']>>;
export type AdminBooking = AdminBookingList['items'][number];
export type AdminBookingDetail = Awaited<ReturnType<AdminServer['getAdminBooking']>>;
export type AdminProviderList = Awaited<ReturnType<AdminServer['listAdminProviders']>>;
export type AdminProvider = AdminProviderList['items'][number];
export type AdminCustomerList = Awaited<ReturnType<AdminServer['listCustomers']>>;
export type AdminCustomerDetail = Awaited<ReturnType<AdminServer['getCustomer']>>;
export type AdminStaffList = Awaited<ReturnType<AdminServer['listStaff']>>;
export type AdminStaff = AdminStaffList['items'][number];
export type AdminBlockList = Awaited<ReturnType<AdminServer['listBlocks']>>;
export type AdminAuditList = Awaited<ReturnType<AdminServer['listAudit']>>;
