import { z } from 'zod';
import { DATE_FLEXIBILITY, ENUMS } from '@/app/lib/catalog';
import {
  zAccessInput,
  zAddressInput,
  zBookingStatus,
  zIsoDate,
  zPagination,
  zServiceType,
  zSlot,
  zTime,
  zZip,
} from '@/app/lib/validation/common';

// ─── Service-specific details (README 5.3) ──────────────────────────────────

export const movingDetailsSchema = z.object({
  homeSize: z.enum(ENUMS.homeSize),
  volume: z.enum(ENUMS.moveVolume),
  specialItems: z.array(z.enum(ENUMS.specialItem)).max(10).default([]),
});

export const furnitureDetailsSchema = z.object({
  furnitureType: z.enum(ENUMS.furnitureType),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  itemCount: z.number().int().min(1).max(20).default(1),
  hasInstructions: z.boolean().optional(),
  needsWallAnchoring: z.boolean().default(false),
});

export const tvDetailsSchema = z.object({
  mountType: z.enum(ENUMS.tvMountType),
  tvSize: z.enum(ENUMS.tvSize),
  wallType: z.enum(ENUMS.wallType),
  bracket: z.enum(ENUMS.bracket),
  tvCount: z.number().int().min(1).max(10).default(1),
  needsPowerOutlet: z.boolean().default(false),
});

export type MovingDetails = z.infer<typeof movingDetailsSchema>;
export type FurnitureDetails = z.infer<typeof furnitureDetailsSchema>;
export type TvDetails = z.infer<typeof tvDetailsSchema>;

// ─── Create booking / estimate ──────────────────────────────────────────────

// The saved-address picker fills these fields on the client; the server always gets a full address.
const zLocation = zAddressInput.extend(zAccessInput.shape);

const base = {
  scheduledDate: zIsoDate,
  preferredSlot: zSlot,
  dateFlexibility: z.enum(DATE_FLEXIBILITY).optional(),
  origin: zLocation,
  notes: z.string().trim().max(1000).optional(),
};

// Discriminated by serviceType so `details` is checked with the right schema.
export const createBookingSchema = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('moving'),
    ...base,
    destination: zLocation,
    details: movingDetailsSchema,
    extraServices: z.array(z.enum(ENUMS.extraService)).max(4).default([]),
  }),
  z.object({
    serviceType: z.literal('furniture_assembly'),
    ...base,
    details: furnitureDetailsSchema,
  }),
  z.object({
    serviceType: z.literal('tv_mounting'),
    ...base,
    details: tvDetailsSchema,
  }),
]);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ─── List / stats query ─────────────────────────────────────────────────────

const zBool = z.enum(['true', 'false']).transform((v) => v === 'true');

export const listBookingsQuery = zPagination.extend({
  q: z.string().trim().max(100).optional(),
  status: zBookingStatus.optional(),
  service: zServiceType.optional(),
  from: zIsoDate.optional(),
  to: zIsoDate.optional(),
  upcoming: zBool.optional(),
  sort: z.enum(['scheduledDate', '-scheduledDate', 'createdAt', '-createdAt', 'upcomingFirst']).default('upcomingFirst'),
});

export const statsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  from: zIsoDate.optional(),
  to: zIsoDate.optional(),
});

// ─── Actions ────────────────────────────────────────────────────────────────

export const modifyBookingSchema = z
  .object({
    notes: z.string().trim().max(1000).nullable().optional(),
    details: z.record(z.string(), z.unknown()).optional(), // re-validated against the booking's service type
    origin: zAccessInput.optional(),
    destination: zAccessInput.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to change');

export const rescheduleSchema = z.object({
  date: zIsoDate,
  preferredSlot: zSlot,
  reason: z.string().trim().max(500).optional(),
});

export const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() });

// ─── Availability ───────────────────────────────────────────────────────────

export const availabilityQuery = z.object({
  service: zServiceType,
  zip: zZip,
  date: zIsoDate,
});

// ─── Admin ──────────────────────────────────────────────────────────────────

export const adminConfirmSchema = z
  .object({
    providerId: z.uuid(),
    windowStart: zTime,
    windowEnd: zTime,
    finalPriceCents: z.number().int().min(0).max(10_000_000).optional(),
    estimatedDurationMin: z.number().int().min(15).max(24 * 60).optional(),
  })
  .refine((v) => v.windowStart < v.windowEnd, { path: ['windowEnd'], message: 'Must be after the window start' });

export const adminAssignSchema = z.object({ providerId: z.uuid() });

export const adminStatusSchema = z.object({ status: z.enum(['in_progress', 'completed']) });

export const adminListQuery = zPagination.extend({
  status: zBookingStatus.optional(),
  service: zServiceType.optional(),
  from: zIsoDate.optional(),
  to: zIsoDate.optional(),
});
