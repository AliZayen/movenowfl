'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Toast from '@/app/components/ui/Toast';
import { UI_STATUS } from '@/app/lib/api/format';
import type { BookingStatusId } from '@/app/lib/catalog';

// Small building blocks shared by the admin pages.

export const inputCls =
  'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-destructive';
export const btnPrimary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-strong px-4 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
export const btnSecondary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-primary hover:border-accent-strong hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-50';
export const btnDanger =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50';

export function PageHeader({ title, subtitle, back, actions }: { title: string; subtitle?: string; back?: { href: string; label: string }; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-accent-strong">
            <Icon name="ArrowLeftIcon" size={14} /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    // min-w-0: wide tables scroll inside the card instead of widening the page.
    <section className={`min-w-0 rounded-2xl border border-border bg-card shadow-soft ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3.5">
          {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, href, tone = 'default', icon }: { label: string; value: number | string | undefined; href?: string; tone?: 'default' | 'warning' | 'accent'; icon: string }) {
  const toneCls = tone === 'warning' ? 'bg-warning/10 text-warning' : tone === 'accent' ? 'bg-accent/10 text-accent-strong' : 'bg-secondary text-primary';
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-accent/40">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon name={icon} size={20} />
      </span>
      <span>
        <span className="tabular block text-2xl font-extrabold text-foreground">{value ?? '–'}</span>
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      </span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Status({ status }: { status: BookingStatusId }) {
  return <StatusBadge status={UI_STATUS[status]} />;
}

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const cls = { default: 'bg-secondary text-primary', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-destructive/10 text-destructive' }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return <p className="px-5 py-3 text-xs text-muted-foreground">{total} result{total === 1 ? '' : 's'}</p>;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
      <span>
        {total} results · page {page} of {totalPages}
      </span>
      <span className="flex gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="h-8 rounded-md border border-border px-3 font-semibold hover:bg-muted disabled:opacity-40">
          Previous
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="h-8 rounded-md border border-border px-3 font-semibold hover:bg-muted disabled:opacity-40">
          Next
        </button>
      </span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-bold underline">
          Try again
        </button>
      )}
    </p>
  );
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="space-y-2 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

/** Toast + notify(), for success and error messages after an action. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const close = useCallback(() => setMessage(null), []);
  return { notify: setMessage, toast: <Toast message={message} onClose={close} /> };
}

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
