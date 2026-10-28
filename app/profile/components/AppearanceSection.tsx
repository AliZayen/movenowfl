'use client';

import React from 'react';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface AppearanceSectionProps {
  theme: string;
  onTheme: (v: string) => void;
}

const themes = [
  { id: 'light', label: 'Light', swatch: 'bg-card border-border' },
  { id: 'system', label: 'System', swatch: 'bg-secondary border-border' },
  { id: 'navy', label: 'Navy accent', swatch: 'bg-primary border-primary' },
];

export default function AppearanceSection({ theme, onTheme }: AppearanceSectionProps) {
  return (
    <ProfileCard id="appearance" icon="PaintBrushIcon" title="Appearance" subtitle="Personalize how MoveNow looks for you.">
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={theme === t.id}
            onClick={() => onTheme(t.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-semibold transition-all active:scale-95 ${
              theme === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-foreground hover:border-accent/50'
            }`}
          >
            <span className={`h-8 w-8 rounded-full border ${t.swatch}`} />
            {t.label}
          </button>
        ))}
      </div>
    </ProfileCard>
  );
}
