'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import Toast from '@/app/components/ui/Toast';
import EstimateCard from '@/app/book-service/components/EstimateCard';

interface BookingFormShellProps {
  service: string; // "Moving"
  title: string;
  subtitle: string;
  children: React.ReactNode; // form sections
  sidebar: React.ReactNode;
  estimatePayload: object | null;
  estimateMissing?: string;
  onSubmit: () => void;
  busy: boolean;
  /** Shown on the button while busy, e.g. photo upload progress. */
  busyLabel?: string | null;
  toast: string | null;
  onCloseToast: () => void;
}

// Shared frame for the three booking forms: breadcrumb, header, actions, live estimate and sidebar.
export default function BookingFormShell(p: BookingFormShellProps) {
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-primary">
        <Link href="/book-service" aria-label="Back to services" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-secondary">
          <Icon name="ArrowLeftIcon" size={16} />
        </Link>
        <Link href="/dashboard" className="hover:text-accent-strong">
          Dashboard
        </Link>
        <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
        <Link href="/book-service" className="hover:text-accent-strong">
          Book a Service
        </Link>
        <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
        <span className="font-semibold" aria-current="page">
          {p.service}
        </span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-xl lg:h-36 lg:w-[420px]">
          <AppImage
            src="https://img.rocket.new/generatedImages/rocket_gen_img_1ecfd21dc-1770563465669.png"
            alt="White MoveNow truck parked outside a Miami apartment building with movers carrying boxes"
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form
          className="space-y-6 xl:col-span-8"
          onSubmit={(e) => {
            e.preventDefault();
            p.onSubmit();
          }}
          noValidate
        >
          {p.children}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <Link
              href="/book-service"
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent hover:text-accent-strong"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={p.busy}
              className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-accent-strong px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              {p.busy ? (p.busyLabel ?? 'Sending request…') : 'Request booking'} {!p.busy && <Icon name="ArrowRightIcon" size={16} />}
            </button>
          </div>
        </form>

        <aside className="space-y-5 xl:col-span-4">
          <EstimateCard payload={p.estimatePayload} missing={p.estimateMissing} />
          {p.sidebar}
        </aside>
      </div>
      <Toast message={p.toast} onClose={p.onCloseToast} />
    </div>
  );
}

/** Address + access fields in the shape POST /bookings expects. */
export function location(
  a: { street: string; city: string; state: string; zip: string },
  access?: { floor?: string; elevator?: boolean; parking?: string; accessNotes?: string },
) {
  return { street: a.street.trim(), city: a.city.trim(), state: a.state || 'FL', zip: a.zip, ...access };
}

/** First missing required field, as a message, or null when the form can be sent. */
export function missingField(checks: [boolean, string][]) {
  return checks.find(([ok]) => !ok)?.[1] ?? null;
}
