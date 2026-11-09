import React from 'react';
import Link from 'next/link';
import AppLogo from '@/app/components/ui/AppLogo';

// Centered card layout for the sign-in, reset-password and verify-email pages.
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <Link href="/" aria-label="MoveNow Miami home" className="mb-8">
        <AppLogo size={52} />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export const fieldCls =
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive';

export const primaryBtn =
  'flex h-11 w-full items-center justify-center rounded-lg bg-accent-strong text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

/** Only allow same-site relative paths as a post-sign-in destination. */
export function safeNext(next: string | null | undefined, fallback = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
