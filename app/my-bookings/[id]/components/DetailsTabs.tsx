'use client';

import React, { useRef, useState } from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import type { Booking, BookingStatus } from '@/app/data/mockData';

interface DetailsTabsProps {
  booking: Booking;
  status: BookingStatus;
  onNotify: (msg: string) => void;
}

type TabId = 'instructions' | 'photos';

const tabs: { id: TabId; label: string }[] = [
  { id: 'instructions', label: 'Special Instructions' },
  { id: 'photos', label: 'Photos' },
];

const MAX_PHOTOS = 5;

export default function DetailsTabs({ booking: b, status, onNotify }: DetailsTabsProps) {
  const [tab, setTab] = useState<TabId>('instructions');
  const [special, setSpecial] = useState('');
  const [saved, setSaved] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ instructions: null, photos: null });
  const editable = status === 'Pending' || status === 'Confirmed';

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list).map((f) => f.name)];
    if (next.length > MAX_PHOTOS - 1) onNotify(`Up to ${MAX_PHOTOS} photos per booking`);
    // TODO: upload via POST /uploads, then POST /bookings/:id/photos
    setFiles(next.slice(0, MAX_PHOTOS - 1));
  };

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((t) => t.id === tab);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div role="tablist" aria-label="Booking details" className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-border px-5" onKeyDown={onTabKey}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 py-3.5 text-sm font-semibold transition-colors ${
                active ? 'text-accent-strong' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t.label}
              <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-accent-strong ${active ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === 'instructions' && (
          <div id="panel-instructions" role="tabpanel" aria-labelledby="tab-instructions" className="space-y-3">
            {editable ? (
              <>
                <label htmlFor="special" className="block text-sm text-muted-foreground">
                  Anything your pro should know: gate code, parking, pets at home, fragile items.
                </label>
                <textarea
                  id="special"
                  rows={4}
                  maxLength={500}
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                  placeholder="e.g. Use the loading dock on 2nd Ave. Building code 1234."
                  className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <div className="flex items-center justify-between">
                  <span className="tabular text-xs text-muted-foreground">{special.length}/500</span>
                  <button
                    type="button"
                    disabled={special === saved}
                    onClick={() => {
                      // TODO: PATCH /bookings/:id { notes }
                      setSaved(special);
                      onNotify('Special instructions saved');
                    }}
                    className="min-h-11 rounded-lg bg-accent-strong px-6 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save instructions
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{saved || 'No special instructions were added to this booking.'}</p>
            )}
          </div>
        )}

        {tab === 'photos' && (
          <div id="panel-photos" role="tabpanel" aria-labelledby="tab-photos" className="space-y-4">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <li className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <AppImage src={b.image} alt={b.imageAlt} fill sizes="200px" className="object-cover" />
              </li>
              {files.map((f, i) => (
                <li key={`${f}-${i}`} className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 p-2 text-center">
                  <Icon name="PhotoIcon" size={20} className="text-muted-foreground" />
                  <span className="w-full truncate text-xs text-foreground">{f}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {editable && files.length < MAX_PHOTOS - 1 && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <Icon name="ArrowUpTrayIcon" size={18} /> Add photos
                  <span className="text-xs font-normal text-muted-foreground">({1 + files.length}/{MAX_PHOTOS})</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
