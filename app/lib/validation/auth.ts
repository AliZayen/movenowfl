import { z } from 'zod';
import { zEmail, zPassword, zPhone } from '@/app/lib/validation/common';

export const signUpSchema = z.object({
  email: zEmail,
  password: zPassword,
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: zPhone.optional(),
});

export const signInSchema = z.object({
  email: zEmail,
  password: z.string().min(1, 'Enter your password').max(200),
  remember: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({ email: zEmail });

export const zOtp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from the email');

export const verifySignUpSchema = z.object({
  email: zEmail,
  code: zOtp,
  remember: z.boolean().default(false),
});

export const resendCodeSchema = z.object({ email: zEmail });

export const resetPasswordSchema = z.object({
  email: zEmail,
  code: zOtp,
  newPassword: zPassword,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(200),
    newPassword: zPassword,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one',
  });

// Signed-in users who haven't confirmed their email yet (accounts from before codes existed).
export const verifyEmailSchema = z.object({ code: zOtp });
