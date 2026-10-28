'use client';

import React, { useMemo, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { PHONE_PRIMARY } from '@/app/lib/contact';

interface SummaryData {
  date: string;
  fromZip: string;
  mountingType: string;
  tvSize:string;
  wallType:string;
}

interface FASummarySidebarProps {
  summary: SummaryData;
  onNotify: (msg: string) => void;
}

const perks = [
  { id: 'perk-1', title: 'Trusted professionals', desc: 'Background checked & insured' },
  { id: 'perk-2', title: 'Flexible scheduling', desc: 'Book at your convenience' },
  { id: 'perk-3', title: 'Transparent pricing', desc: 'No hidden fees' },
];

export default function FASummarySidebar({ summary, onNotify }: FASummarySidebarProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);

  const [dateValue, setDateValue] = useState('2026-10-30');

  const rows = [
    { id: 'r-1', icon: 'TruckIcon', label: 'Service type', value: 'TV Mounting' },
    { id: 'r-2', icon: 'CalendarDaysIcon', label: 'Move date', value: summary.date },
    { id: 'r-3', icon: 'MapPinIcon', label: 'From ZIP', value: summary.fromZip },
    { id: 'r-4', icon: 'WrenchIcon', label: 'Mounting Type', value: summary.mountingType },
    { id: 'r-5', icon: 'ArrowsPointingOutIcon', label: 'TV Size', value: summary.tvSize || " --- " },
    { id: 'r-6', icon: 'Square3Stack3DIcon', label: 'Wall type', value: (summary.wallType || " --- ") },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-3 text-base font-bold text-foreground">
          <Icon name="ClipboardDocumentListIcon" size={24} className="text-primary" />
          Your Move Summary
        </h2>
        <ul className="mt-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0">
              <span className="flex items-center gap-3 text-foreground">
                <Icon name={r.icon} size={20} className="text-primary" />
                {r.label}
              </span>
              <span className="tabular text-right text-foreground">{r.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-accent/10 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon name="PhoneIcon" size={18} variant="solid" />
          </span>
          <div>
            <p className="text-xs text-foreground">Need help?</p>
            <p className="tabular text-sm font-bold text-accent">{PHONE_PRIMARY.display}</p>
          </div>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/10 p-5">
        <Icon name="ShieldCheckIcon" size={32} className="shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">Safe &amp; Reliable</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your move is in good hands. Our team is insured and professional.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold text-foreground">Why choose MoveNow?</h2>
        <ul className="mt-3 space-y-4">
          {perks.map((p) => (
            <li key={p.id} className="flex gap-3">
              <Icon name="CheckIcon" size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-soft">
        <h2 className="text-lg font-bold">Already have an account?</h2>
        <p className="mt-1 text-xs opacity-80">Log in to save your information and get a faster quote next time.</p>
        <div className="mt-4 space-y-3">
          <label className="relative block">
            <span className="sr-only">Email</span>
            <Icon name="EnvelopeIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full rounded-md bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Password</span>
            <Icon name="LockClosedIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="h-10 w-full rounded-md bg-card pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Icon name={show ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
            </button>
          </label>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              Remember me
            </label>
            <button type="button" onClick={() => onNotify('Password reset link sent (demo)')} className="font-semibold underline">
              Forgot password?
            </button>
          </div>
          <button
            type="button"
            onClick={() => onNotify('Signed in as John Doe (demo)')}
            className="h-10 w-full rounded-md bg-accent text-sm font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95"
          >
            Sign in
          </button>
          <p className="text-center text-xs opacity-70">or</p>
          <p className="text-xs opacity-80">Don&apos;t have an account? Create one now.</p>
          <button
            type="button"
            onClick={() => onNotify('Account creation opens here (demo)')}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/60 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
          >
            <Icon name="UserIcon" size={16} /> Sign up
          </button>
        </div>
      </section> */}
    </div>
  );
}
