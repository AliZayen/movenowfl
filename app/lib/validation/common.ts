import { z } from 'zod';
import { BOOKING_STATUSES, ENUMS, SERVICE_TYPES, SLOT_TIMES } from '@/app/lib/catalog';

// Shared building blocks. Safe to import from client components for form validation.

export const zServiceType = z.enum(SERVICE_TYPES);
export const zBookingStatus = z.enum(BOOKING_STATUSES);

export const zIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Not a real date');

export const zSlot = z.enum(SLOT_TIMES, { error: 'Pick a time between 8:00 AM and 7:00 PM' });
export const zTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the format HH:MM');

export const zZip = z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code');

// US numbers in any common format → E.164 (+1XXXXXXXXXX).
export const zPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[^\d+]/g, ''))
  .transform((s) => (s.startsWith('+') ? s : s.length === 10 ? `+1${s}` : s.length === 11 && s.startsWith('1') ? `+${s}` : s))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid phone number'));

// Trim before checking the format, so a pasted " name@example.com " is accepted.
export const zEmail = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

// bcrypt reads at most 72 bytes, so cap the length.
export const zPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const zPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const zAddressInput = z.object({
  street: z.string().trim().min(1, 'Please enter a street address').max(200),
  apt: z.string().trim().max(50).optional().nullable(),
  city: z.string().trim().min(1, 'Please enter a city').max(100),
  state: z.string().trim().length(2).toUpperCase().default('FL'),
  zip: zZip,
});

export const zAccessInput = z.object({
  floor: z.enum(ENUMS.floor).optional(),
  elevator: z.boolean().optional(),
  parking: z.enum(ENUMS.parking).optional(),
  accessNotes: z.string().trim().max(500).optional(),
});
