'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiClientError } from '@/app/lib/api/client';
import type { ApiUser } from '@/app/lib/api/types';

type Status = 'loading' | 'authenticated' | 'guest';

interface SessionValue {
  status: Status;
  user: ApiUser | null;
  /** Re-read the session from the server (after sign-in or a profile change). */
  refresh: () => Promise<ApiUser | null>;
  /** Replace the cached user with a fresh copy returned by an API call. */
  setUser: (user: ApiUser) => void;
  signIn: (email: string, password: string, remember: boolean) => Promise<ApiUser>;
  /** Step 1: emails a 6-digit code. Nobody is signed in yet. */
  signUp: (input: { email: string; password: string; fullName?: string; phone?: string }) => Promise<CodeStep>;
  /** Step 2 (also after sign-in says EMAIL_NOT_VERIFIED): checks the code and signs in. */
  verifyEmail: (email: string, code: string, remember?: boolean) => Promise<ApiUser>;
  /** Second step of a staff sign-in (after signIn throws MFA_REQUIRED). */
  verifyStaff: (email: string, code: string) => Promise<ApiUser>;
  /** Sign out; with `redirectTo`, finish with a full page load to that path. */
  signOut: (redirectTo?: string) => Promise<void>;
}

/** Returned when the server has emailed a code. `resendInSec` is the wait before "Resend". */
export interface CodeStep {
  email: string;
  codeLength: number;
  expiresInSec: number;
  resendInSec: number;
  message: string;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUserState] = useState<ApiUser | null>(null);

  const apply = useCallback((u: ApiUser | null) => {
    setUserState(u);
    setStatus(u ? 'authenticated' : 'guest');
    return u;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: ApiUser }>('/auth/session');
      return apply(user);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) return apply(null);
      return apply(null);
    }
  }, [apply]);

  useEffect(() => {
    let active = true;
    api<{ user: ApiUser }>('/auth/session').then(
      ({ user }) => active && apply(user),
      () => active && apply(null),
    );
    return () => {
      active = false;
    };
  }, [apply]);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      user,
      refresh,
      setUser: (u) => apply(u),
      signIn: async (email, password, remember) => {
        const { user } = await api<{ user: ApiUser }>('/auth/signin', { method: 'POST', body: { email, password, remember } });
        return apply(user)!;
      },
      signUp: (input) => api<CodeStep>('/auth/signup', { method: 'POST', body: input }),
      verifyEmail: async (email, code, remember = false) => {
        const { user } = await api<{ user: ApiUser }>('/auth/signup/verify', { method: 'POST', body: { email, code, remember } });
        return apply(user)!;
      },
      verifyStaff: async (email, code) => {
        const { user } = await api<{ user: ApiUser }>('/auth/signin/verify', { method: 'POST', body: { email, code } });
        return apply(user)!;
      },
      signOut: async (redirectTo?: string) => {
        await api('/auth/signout', { method: 'POST' }).catch(() => undefined);
        // A full page load clears every cached response and avoids the sign-in guard
        // redirecting first (it would bounce to /signin?next=… instead of `redirectTo`).
        if (redirectTo) window.location.assign(redirectTo);
        else apply(null);
      },
    }),
    [status, user, refresh, apply],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
