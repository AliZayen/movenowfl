import { connection, type NextRequest } from 'next/server';
import { ZodError, type z } from 'zod';
import { Prisma } from '@/generated/prisma/client';

// Error shape from README 7.1: { error: { code, message, fields? } }
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'EMAIL_NOT_VERIFIED'
  | 'MFA_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_SERVICE_AREA'
  | 'RATE_LIMITED'
  | 'EMAIL_NOT_SENT'
  | 'FILE_TOO_LARGE'
  | 'INTERNAL';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string>,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export const errors = {
  validation: (message = 'Please check the highlighted fields', fields?: Record<string, string>) =>
    new ApiError(400, 'VALIDATION_ERROR', message, fields),
  unauthenticated: () => new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue'),
  forbidden: (message = "You don't have access to this") => new ApiError(403, 'FORBIDDEN', message),
  notFound: (what = 'Resource') => new ApiError(404, 'NOT_FOUND', `${what} not found`),
  conflict: (message: string) => new ApiError(409, 'CONFLICT', message),
  outOfArea: (zip: string) => new ApiError(422, 'OUT_OF_SERVICE_AREA', `We don't serve ZIP code ${zip} yet`),
  rateLimited: (retryAfterSec: number) =>
    new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.', undefined, {
      'Retry-After': String(retryAfterSec),
    }),
};

export function json<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

function zodFields(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    throw errors.validation('Request body must be valid JSON');
  }
  const result = schema.safeParse(body);
  if (!result.success) throw errors.validation(undefined, zodFields(result.error));
  return result.data;
}

export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.output<S> {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) throw errors.validation('Invalid query parameters', zodFields(result.error));
  return result.data;
}

// CSRF defence for cookie-authenticated mutations: browsers always send Origin on cross-site
// POST/PATCH/DELETE, so reject any Origin that isn't this app. Requests without Origin
// (curl, server-to-server) carry no ambient browser cookies and are allowed.
function checkOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return;
  const allowed = new Set([req.nextUrl.origin]);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  if (!allowed.has(origin)) throw errors.forbidden('Cross-site request blocked');
}

function toErrorResponse(err: unknown, requestId: string, req: NextRequest) {
  let apiError: ApiError;
  if (err instanceof ApiError) apiError = err;
  else if (err instanceof ZodError) apiError = errors.validation(undefined, zodFields(err));
  else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
    apiError = errors.conflict('That already exists');
  else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') apiError = errors.notFound();
  else {
    // Log the path only (no query string) to keep PII out of logs.
    console.error(`[api] ${requestId} ${req.method} ${req.nextUrl.pathname} failed`, err);
    apiError = new ApiError(500, 'INTERNAL', 'Something went wrong. Please try again.');
  }
  const { status, code, message, fields, headers } = apiError;
  return json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    // Errors are never cached either (a 404 is cacheable by default).
    { status, headers: { ...headers, 'x-request-id': requestId, 'Cache-Control': 'no-store' } },
  );
}

type Handler<P> = (req: NextRequest, ctx: { params: P }) => Promise<Response>;

// Wrap every route handler: request-time only, origin check on mutations, uniform errors.
export function handler<P = Record<string, never>>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    await connection(); // never prerender API routes (Cache Components)
    const requestId = crypto.randomUUID();
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) checkOrigin(req);
      const res = await fn(req, { params: await ctx.params });
      res.headers.set('x-request-id', requestId);
      // File routes set their own caching; everything else is never cached.
      if (!res.headers.has('Cache-Control')) res.headers.set('Cache-Control', 'no-store');
      return res;
    } catch (err) {
      return toErrorResponse(err, requestId, req);
    }
  };
}

/**
 * The client's IP, for rate limits and the audit log. Anyone can send their own `X-Forwarded-For`,
 * and each proxy *appends* the address it saw, so only entries added by our own proxies can be
 * trusted. Count TRUST_PROXY_HOPS proxies (default 1: Vercel, or one nginx / load balancer) from the
 * right: the entry that far from the end is the real client. Entries before it are client-supplied
 * and ignored. Set TRUST_PROXY_HOPS=0 if the app is reachable directly, with no proxy in front.
 */
export function clientIp(req: Pick<Request, 'headers'>, hops = trustedProxyHops()) {
  if (hops <= 0) return 'direct';
  const chain = (req.headers.get('x-forwarded-for') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (chain.length >= hops) return chain[chain.length - hops];
  // No (or too short a) forwarded chain: fall back to the proxy's own header, which it overwrites.
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function trustedProxyHops() {
  const n = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(n) && n >= 0 ? n : 1;
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function paginate(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
