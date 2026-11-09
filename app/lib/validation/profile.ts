import { z } from 'zod';
import { zAddressInput, zPhone } from '@/app/lib/validation/common';

export const updateMeSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    phone: zPhone.nullable().optional(),
  })
  .strict(); // email can't be changed here

export const LANGUAGES = ['en', 'es', 'pt'] as const;
export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
export const THEMES = ['light', 'system', 'navy'] as const;

export const updatePreferencesSchema = z
  .object({
    language: z.enum(LANGUAGES).optional(),
    timezone: z
      .string()
      .max(64)
      .refine((tz) => {
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, 'Unknown time zone')
      .optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
    theme: z.enum(THEMES).optional(),
    notifications: z
      .object({
        booking: z.boolean().optional(),
        messages: z.boolean().optional(),
        promos: z.boolean().optional(),
        news: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(200) });

export const createAddressSchema = zAddressInput.extend({
  label: z.string().trim().min(1).max(40),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial().omit({ isDefault: true });
