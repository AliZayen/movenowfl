'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';

export const settingsSections = [
  { id: 'personal', label: 'Personal Information', icon: 'UserIcon' },
  { id: 'addresses', label: 'Saved Addresses', icon: 'MapPinIcon' },
  { id: 'language', label: 'Language & Region', icon: 'GlobeAltIcon' },
  { id: 'notifications', label: 'Notifications', icon: 'BellIcon' },
  { id: 'security', label: 'Security & Password', icon: 'ShieldCheckIcon' },
  { id: 'payments', label: 'Payment Methods', icon: 'CreditCardIcon' },
  { id: 'appearance', label: 'Appearance', icon: 'PaintBrushIcon' },
];

interface SettingsSidebarProps {
  active: string;
  onSelect: (id: string) => void;
}

export default function SettingsSidebar({ active, onSelect }: SettingsSidebarProps) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-4 shadow-soft lg:sticky lg:top-40 lg:self-start">
      <h1 className="text-lg font-bold text-primary">Profile &amp; Settings</h1>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">Manage your account and preferences.</p>
      <nav aria-label="Settings sections" className="scrollbar-hide flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {settingsSections.map((s) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-lg border-l-4 px-3 py-3 text-left text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-accent bg-accent/10 text-accent' :'border-transparent text-primary hover:bg-secondary'
              }`}
            >
              <Icon name={s.icon} size={18} />
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
