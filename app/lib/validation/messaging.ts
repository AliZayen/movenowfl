import { z } from 'zod';

// Shared by the API and the composer, so the browser shows the same limits the server enforces.
export const MESSAGE_MAX_LENGTH = 2000;

export const startConversationSchema = z.object({
  bookingId: z.string().trim().min(1, 'Pick a booking').max(64),
});

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a message first')
    .max(MESSAGE_MAX_LENGTH, `Keep messages under ${MESSAGE_MAX_LENGTH} characters`),
});

// Moderator / support only (app/lib/server/messaging.ts checks the seat).
export const updateConversationSchema = z.object({
  closed: z.boolean(),
});

export const listConversationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

// `before` loads older history; `after` fetches only what's new (used by polling).
export const listMessagesQuery = z.object({
  before: z.iso.datetime().optional(),
  after: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
