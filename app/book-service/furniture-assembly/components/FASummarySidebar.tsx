'use client';

import React, { useMemo, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface SummaryData {
  date: string;
  fromZip: string;
  brandModel: string;
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
    { id: 'r-1', icon: 'TruckIcon', label: 'Service type', value: 'Furniture Assembly' },
    { id: 'r-2', icon: 'CalendarDaysIcon', label: 'Booking date', value: summary.date },
    { id: 'r-3', icon: 'MapPinIcon', label: 'From ZIP', value: summary.fromZip },
    { id: 'r-4', icon: 'BuildingOffice2Icon', label: 'Brand & Model', value: summary.brandModel },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-3 text-base font-bold text-foreground">
          <Icon name="ClipboardDocumentListIcon" size={24} className="text-primary" />
          Your Furniture Assembly Summary
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
            <p className="tabular text-sm font-bold text-accent">+1 (305) 555-0123</p>
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
    </div>
  );
}
