'use client';

import React, { useRef, useState } from 'react';
import BookingPhotos from '@/app/my-bookings/[id]/components/BookingPhotos';
import { api, errorMessage } from '@/app/lib/api/client';
import type { ApiBookingDetail } from '@/app/lib/api/types';
import {
  BRACKETS,
  EXTRA_SERVICES,
  FLOORS,
  FURNITURE_TYPES,
  HOME_SIZES,
  MOVE_VOLUMES,
  PARKING,
  SPECIAL_ITEMS,
  TV_MOUNT_TYPES,
  TV_SIZES,
  WALL_TYPES,
} from '@/app/lib/catalog';

interface DetailsTabsProps {
  booking: ApiBookingDetail;
  onUpdated: (booking: ApiBookingDetail, message: string) => void;
  onNotify: (msg: string) => void;
}

type TabId = 'request' | 'instructions' | 'photos';
const tabs: { id: TabId; label: string }[] = [
  { id: 'request', label: 'Your request' },
  { id: 'instructions', label: 'Special Instructions' },
  { id: 'photos', label: 'Photos' },
];

const label = (opts: readonly { id: string; label: string }[], id: unknown) => opts.find((o) => o.id === id)?.label ?? '—';
const yesNo = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : '—');

/** Service details stored as ids → rows of label/value for display. */
export function requestRows(b: ApiBookingDetail): [string, string][] {
  const d = (b.details ?? {}) as Record<string, unknown>;
  const access = (side: 'origin' | 'destination', name: string): [string, string][] => {
    const a = b[side];
    if (!a) return [];
    return [[`${name} access`, [label(FLOORS, a.floor) !== '—' ? `${label(FLOORS, a.floor)} floor` : null, a.elevator === null ? null : a.elevator ? 'elevator' : 'no elevator', a.parking ? label(PARKING, a.parking).toLowerCase() : null].filter(Boolean).join(', ') || '—']];
  };
  if (b.serviceType === 'moving') {
    const specials = (d.specialItems as string[] | undefined) ?? [];
    return [
      ['Home size', label(HOME_SIZES, d.homeSize)],
      ['Volume', label(MOVE_VOLUMES, d.volume)],
      ['Special items', specials.length ? specials.map((s) => label(SPECIAL_ITEMS, s)).join(', ') : 'None'],
      ['Extra services', b.extraServices.length ? b.extraServices.map((s) => label(EXTRA_SERVICES, s)).join(', ') : 'None'],
      ...access('origin', 'Pickup'),
      ...access('destination', 'Drop-off'),
    ];
  }
  if (b.serviceType === 'furniture_assembly') {
    return [
      ['Furniture', label(FURNITURE_TYPES, d.furnitureType)],
      ['Items', String(d.itemCount ?? 1)],
      ['Brand / model', [d.brand, d.model].filter(Boolean).join(' ') || '—'],
      ['Has instructions', yesNo(d.hasInstructions)],
      ['Wall anchoring', yesNo(d.needsWallAnchoring)],
      ...access('origin', 'Job'),
    ];
  }
  return [
    ['Mounting', label(TV_MOUNT_TYPES, d.mountType)],
    ['TV size', label(TV_SIZES, d.tvSize)],
    ['Wall', label(WALL_TYPES, d.wallType)],
    ['Bracket', label(BRACKETS, d.bracket)],
    ['TVs', String(d.tvCount ?? 1)],
    ['Power outlet needed', yesNo(d.needsPowerOutlet)],
    ...access('origin', 'Job'),
  ];
}

export default function DetailsTabs({ booking: b, onUpdated, onNotify }: DetailsTabsProps) {
  const [tab, setTab] = useState<TabId>('request');
  const [notes, setNotes] = useState(b.notes ?? '');
  const [saving, setSaving] = useState(false);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ request: null, instructions: null, photos: null });
  const editable = b.permissions.canModify;

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { booking } = await api<{ booking: ApiBookingDetail }>(`/bookings/${b.id}`, { method: 'PATCH', body: { notes: notes.trim() || null } });
      onUpdated(booking, 'Special instructions saved');
    } catch (e) {
      onNotify(errorMessage(e));
    } finally {
      setSaving(false);
    }
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
              className={`relative shrink-0 py-3.5 text-sm font-semibold transition-colors ${active ? 'text-accent-strong' : 'text-muted-foreground hover:text-primary'}`}
            >
              {t.label}
              <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-accent-strong ${active ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === 'request' && (
          <dl id="panel-request" role="tabpanel" aria-labelledby="tab-request" className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {requestRows(b).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="text-sm font-semibold text-foreground">{v}</dd>
              </div>
            ))}
            {b.origin.accessNotes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Access instructions</dt>
                <dd className="text-sm text-foreground">{b.origin.accessNotes}</dd>
              </div>
            )}
          </dl>
        )}

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
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Use the loading dock on 2nd Ave. Building code 1234."
                  className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <div className="flex items-center justify-between">
                  <span className="tabular text-xs text-muted-foreground">{notes.length}/1000</span>
                  <button
                    type="button"
                    disabled={saving || notes.trim() === (b.notes ?? '')}
                    onClick={saveNotes}
                    className="min-h-11 rounded-lg bg-accent-strong px-6 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save instructions'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground">{b.notes || 'No special instructions were added to this booking.'}</p>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <p className="text-xs text-muted-foreground">Changes are closed within 24 hours of your arrival window. Please call us instead.</p>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'photos' && <BookingPhotos booking={b} onUpdated={onUpdated} onNotify={onNotify} />}
      </div>
    </section>
  );
}
