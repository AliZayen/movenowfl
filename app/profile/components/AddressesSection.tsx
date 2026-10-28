'use client';

import React, { useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface SavedAddress {
  id: string;
  label: string;
  icon: string;
  line: string;
  isDefault: boolean;
}

interface AddressesSectionProps {
  onNotify: (msg: string) => void;
}

const initial: SavedAddress[] = [
  { id: 'addr-home', label: 'Home', icon: 'HomeIcon', line: '123 Ocean Dr, Miami, FL, 33139', isDefault: true },
  { id: 'addr-office', label: 'Office', icon: 'BriefcaseIcon', line: '456 Brickell Ave, Miami, FL, 33131', isDefault: false },
  { id: 'addr-gym', label: 'Gym', icon: 'MapPinIcon', line: '789 Collins Ave, Miami, FL, 33139', isDefault: false },
];

export default function AddressesSection({ onNotify }: AddressesSectionProps) {
  const [items, setItems] = useState<SavedAddress[]>(initial);

  return (
    <ProfileCard
      id="addresses"
      icon="MapPinIcon"
      title="Saved Addresses"
      subtitle="Manage your frequently used addresses."
      action={
        <button
          type="button"
          onClick={() => {
            setItems((prev) => [
              ...prev,
              {
                id: `addr-new-${prev.length + 1}`,
                label: `Address ${prev.length + 1}`,
                icon: 'MapPinIcon',
                line: '1 Biscayne Blvd, Miami, FL, 33132',
                isDefault: false,
              },
            ]);
            onNotify('New address added');
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95"
        >
          <Icon name="PlusIcon" size={14} /> Add New Address
        </button>
      }
    >
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <Icon name={a.icon} size={22} className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {a.label}
                {a.isDefault && (
                  <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">Default</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{a.line}</p>
            </div>
            <button
              type="button"
              aria-label={`Edit ${a.label}`}
              onClick={() => onNotify(`Editing ${a.label}`)}
              className="rounded-md p-2 text-primary hover:bg-secondary"
            >
              <Icon name="PencilIcon" size={16} />
            </button>
            <button
              type="button"
              aria-label={`Delete ${a.label}`}
              onClick={() => {
                setItems((prev) => prev.filter((x) => x.id !== a.id));
                onNotify(`${a.label} removed`);
              }}
              className="rounded-md p-2 text-primary hover:bg-secondary hover:text-destructive"
            >
              <Icon name="TrashIcon" size={16} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No saved addresses yet.
          </li>
        )}
      </ul>
    </ProfileCard>
  );
}
