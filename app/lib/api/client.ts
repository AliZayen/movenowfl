'use client';

import { useCallback, useEffect, useState } from 'react';

// Browser-side helper for /api/v1. Sends the session cookie (same origin) and turns the
// { error: { code, message, fields } } shape into an ApiClientError.

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, { method = 'GET', body, signal }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiClientError(0, 'NETWORK', "Can't reach the server. Check your connection and try again.");
  }
  return readResponse<T>(res);
}

async function readResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiClientError(res.status, err?.code ?? 'INTERNAL', err?.message ?? 'Something went wrong', err?.fields);
  }
  return data as T;
}

/** Sends one file as multipart/form-data in the field "file" (what the upload endpoints expect). */
export async function upload<T>(path: string, file: File, signal?: AbortSignal): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, { method: 'POST', body: form, signal, credentials: 'same-origin' });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiClientError(0, 'NETWORK', "Can't reach the server. Check your connection and try again.");
  }
  return readResponse<T>(res);
}

/** The message to show for any error thrown by `api()`: the first field error if there is one. */
export function errorMessage(e: unknown) {
  if (e instanceof ApiClientError) {
    const first = e.fields ? Object.values(e.fields)[0] : undefined;
    return first && e.code === 'VALIDATION_ERROR' ? first : e.message;
  }
  return 'Something went wrong. Please try again.';
}

interface State<T> {
  key: string | null;
  data?: T;
  error?: ApiClientError;
}

/**
 * Loads `path` and reloads whenever it changes. Pass null to skip (e.g. until a form is valid).
 * `loading` is true until the response for the current path arrives; old data stays visible meanwhile.
 */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const key = path === null ? null : `${path}#${version}`;
  const [state, setState] = useState<State<T>>({ key: null });

  useEffect(() => {
    if (path === null || key === null) return;
    const ctrl = new AbortController();
    api<T>(path, { signal: ctrl.signal }).then(
      (data) => setState({ key, data }),
      (error) => {
        if (error?.name !== 'AbortError') setState((s) => ({ key, data: s.data, error }));
      },
    );
    return () => ctrl.abort();
  }, [path, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const mutate = useCallback((data: T) => setState((s) => ({ ...s, data, error: undefined })), []);

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: path !== null && state.key !== key,
    reload,
    mutate,
  };
}

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}
