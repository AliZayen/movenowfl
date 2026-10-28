'use client';

import React from 'react';
import SectionCard from '@/app/book-service/components/SectionCard';

interface ItemsSizeSectionProps {
  homeType: string;
  onHomeType: (v: string) => void;
  volume: string;
  onVolume: (v: string) => void;
  specials: string[];
  onSpecials: (v: string[]) => void;
  notes: string;
  onNotes: (v: string) => void;
}

const homeTypes = [
  { id: 'studio', label: 'Studio', range: '0 - 400 sqft' },
  { id: '1br', label: '1 Bedroom', range: '401 - 800 sqft' },
  { id: '2br', label: '2 Bedrooms', range: '801 - 1200 sqft' },
  { id: '3br', label: '3 Bedrooms', range: '1201 - 1800 sqft' },
  { id: '4br', label: '4+ Bedrooms', range: '1800+ sqft' },
];

const volumes = [
  { id: 'few', label: 'A few items' },
  { id: 'half', label: 'Half a truck' },
  { id: 'full', label: 'Full truck' },
  { id: 'unsure', label: 'Not sure' },
];

const specialItems = ['Piano', 'Safe', 'Gym equipment', 'Large appliances', 'Artwork', 'None'];

const optionCls = (active: boolean) =>
  `rounded-lg border px-3 py-3 text-center transition-all duration-150 active:scale-[0.98] ${
    active
      ? 'border-accent bg-accent/10 text-accent' :'border-border bg-card text-foreground hover:border-accent/50'
  }`;

export default function ItemsSizeSection({
  homeType,
  onHomeType,
  volume,
  onVolume,
  specials,
  onSpecials,
  notes,
  onNotes,
}: ItemsSizeSectionProps) {
  const toggleSpecial = (item: string) => {
    if (item === 'None') {
      onSpecials(specials.includes('None') ? [] : ['None']);
      return;
    }
    const without = specials.filter((s) => s !== 'None');
    onSpecials(without.includes(item) ? without.filter((s) => s !== item) : [...without, item]);
  };

  return (
    <SectionCard step={2} icon="CubeIcon" title="Items & Size" subtitle="What are you moving?">
      <p className="mb-2 text-sm font-semibold text-foreground">Home type</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {homeTypes.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={homeType === h.id}
            onClick={() => onHomeType(h.id)}
            className={optionCls(homeType === h.id)}
          >
            <span className="block text-xs font-bold">{h.label}</span>
            <span className="mt-0.5 block text-[11px] opacity-80">{h.range}</span>
          </button>
        ))}
      </div>

      <p className="mb-2 mt-6 text-sm font-semibold text-foreground">Approximate volume</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {volumes.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={volume === v.id}
            onClick={() => onVolume(v.id)}
            className={`${optionCls(volume === v.id)} text-xs font-semibold`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-6 text-sm font-semibold text-foreground">
        Special items <span className="font-normal text-muted-foreground">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {specialItems.map((s) => {
          const active = specials.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => toggleSpecial(s)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all active:scale-95 ${
                active
                  ? 'border-accent bg-accent/10 text-accent' :'border-border bg-card text-foreground hover:border-accent/50'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <label htmlFor="extra-notes" className="mb-2 mt-6 block text-sm font-semibold text-foreground">
        Additional notes <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="extra-notes"
        rows={3}
        maxLength={300}
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="Any special instructions or items we should know about..."
        className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
      <p className="tabular mt-1 text-right text-xs text-muted-foreground">{notes.length}/300</p>
    </SectionCard>
  );
}
