import { z } from 'zod';
import { SERVICE_TYPES } from '@/app/lib/catalog';
import { STAFF_ROLES } from '@/app/lib/staff';
import { zBookingStatus, zEmail, zIsoDate, zPagination, zPhone, zServiceType, zSlot } from '@/app/lib/validation/common';

export const adminBookingsQuery = zPagination.extend({
  q: z.string().trim().max(100).optional(),
  status: zBookingStatus.optional(),
  service: zServiceType.optional(),
  from: zIsoDate.optional(),
  to: zIsoDate.optional(),
  unassigned: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort: z.enum(['created_desc', 'created_asc', 'scheduled_asc', 'scheduled_desc']).default('created_desc'),
});

export const adminCancelSchema = z.object({ reason: z.string().trim().min(3, 'Give a short reason').max(500) });

const zName = z.string().trim().min(2, 'Enter a name').max(120);

export const providerInputSchema = z.object({
  displayName: zName,
  phone: zPhone.nullable().optional(),
  services: z.array(z.enum(SERVICE_TYPES)).min(1, 'Pick at least one service'),
  areaIds: z.array(z.uuid()).min(1, 'Pick at least one service area'),
  avatarUrl: z.url().max(500).nullable().optional(),
  backgroundChecked: z.boolean().default(false),
  insured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const providerUpdateSchema = providerInputSchema.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to change');

export const providersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  service: zServiceType.optional(),
  active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const customersQuery = zPagination.extend({ q: z.string().trim().max(100).optional() });

export const staffCreateSchema = z.object({
  email: zEmail,
  fullName: zName,
  staffRole: z.enum(STAFF_ROLES),
});

export const staffUpdateSchema = z
  .object({ staffRole: z.enum(STAFF_ROLES).optional(), disabled: z.boolean().optional() })
  .refine((v) => v.staffRole !== undefined || v.disabled !== undefined, 'Nothing to change');

export const blockCreateSchema = z.object({
  date: zIsoDate,
  slot: zSlot.nullable().default(null), // null = the whole day
  serviceType: zServiceType.nullable().default(null), // null = every service
  areaId: z.uuid().nullable().default(null), // null = every area
  reason: z.string().trim().max(200).optional(),
});

export const blocksQuery = z.object({ from: zIsoDate.optional() });

export const auditQuery = zPagination.extend({
  targetType: z.enum(['booking', 'provider', 'user', 'availability_block']).optional(),
  targetId: z.string().max(64).optional(),
  actorId: z.uuid().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
