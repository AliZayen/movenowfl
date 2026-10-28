'use client';

import React, { useRef, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';

interface DetailsTabsProps {
  onNotify: (msg: string) => void;
}

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'address', label: 'Address & Location' },
  { id: 'instructions', label: 'Special Instructions' },
  { id: 'photos', label: 'Photos' },
];

const fieldCls =
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20';

export default function DetailsTabs({ onNotify }: DetailsTabsProps) {
  const [tab, setTab] = useState('details');
  const [service, setService] = useState('TV Mounting');
  const [count, setCount] = useState(1);
  const [size, setSize] = useState('65" OLED');
  const [notes, setNotes] = useState('');
  const [special, setSpecial] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => f.name)].slice(0, 5));
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div role="tablist" className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-border px-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 py-3.5 text-sm font-semibold transition-colors ${
              tab === t.id ? 'text-accent' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {t.label}
            <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-accent ${tab === t.id ? 'opacity-100' : 'opacity-0'}`} />
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'details' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon name="WrenchScrewdriverIcon" size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Service Details</h2>
                <p className="text-xs text-muted-foreground">Tell us what you need and any additional information.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr_1.2fr]">
              <div>
                <label htmlFor="svc" className="mb-1 block text-xs font-medium text-foreground">
                  Service type <span className="text-destructive">*</span>
                </label>
                <select id="svc" value={service} onChange={(e) => setService(e.target.value)} className={fieldCls}>
                  <option>TV Mounting</option>
                  <option>Moving</option>
                  <option>Furniture Assembly</option>
                </select>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-foreground">
                  Number of TVs <span className="text-destructive">*</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease"
                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-primary hover:border-accent"
                  >
                    <Icon name="MinusIcon" size={16} />
                  </button>
                  <input
                    readOnly
                    aria-label="Number of TVs"
                    value={count}
                    className="tabular h-11 w-full min-w-0 rounded-lg border border-border bg-card text-center text-sm"
                  />
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => setCount((c) => Math.min(5, c + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-primary hover:border-accent"
                  >
                    <Icon name="PlusIcon" size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="tv-size" className="mb-1 block text-xs font-medium text-foreground">
                  TV size (inches) <span className="text-destructive">*</span>
                </label>
                <select id="tv-size" value={size} onChange={(e) => setSize(e.target.value)} className={fieldCls}>
                  <option>43&quot; LED</option>
                  <option>55&quot; LED</option>
                  <option>65&quot; OLED</option>
                  <option>75&quot; OLED</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="add-notes" className="mb-1 block text-xs font-medium text-foreground">
                Additional notes <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="add-notes"
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Wall type, soundbar, cable concealment, etc."
                className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <p className="tabular text-right text-xs text-muted-foreground">{notes.length}/500</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon name="PaperClipIcon" size={18} className="text-primary" />
                Additional documents <span className="font-normal text-muted-foreground">(optional)</span>
              </p>
              <p className="mb-3 ml-7 text-xs text-muted-foreground">
                Upload any relevant photos or documents (e.g. wall details, instructions).
              </p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-border bg-card py-6 hover:border-accent/50"
              >
                <Icon name="ArrowUpTrayIcon" size={24} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Drag &amp; drop files here</span>
                <span className="text-[11px] text-muted-foreground">or click to browse — up to 5 files</span>
              </button>
              {files.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <li key={`${f}-${i}`} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
                      <span className="max-w-40 truncate">{f}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${f}`}
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Icon name="XMarkIcon" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => onNotify('Service details updated')}
                className="rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95"
              >
                Save details
              </button>
            </div>
          </div>
        )}

        {tab === 'address' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Address &amp; Location</h2>
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Icon name="MapPinIcon" size={20} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Office</p>
                <p className="text-xs text-muted-foreground">456 Brickell Ave, Miami, FL, 33131</p>
                <p className="mt-2 text-xs text-muted-foreground">Floor: 14th • Elevator: Yes • Parking: Garage</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'instructions' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Special Instructions</h2>
            <label htmlFor="special" className="sr-only">Special instructions</label>
            <textarea
              id="special"
              rows={5}
              maxLength={500}
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
              placeholder="Parking info, building access, pets at home, etc."
              className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
            <div className="text-right">
              <button
                type="button"
                onClick={() => onNotify('Special instructions saved')}
                className="rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-accent-foreground hover:opacity-90 active:scale-95"
              >
                Save instructions
              </button>
            </div>
          </div>
        )}

        {tab === 'photos' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Photos</h2>
            <p className="text-sm text-muted-foreground">3 photos were attached to this booking. Use the gallery above to review them.</p>
          </div>
        )}
      </div>
    </section>
  );
}
