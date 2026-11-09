'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import Select, { inputCls } from '@/app/book-service/components/Select';
import { useSavedAddresses } from '@/app/lib/api/hooks';

export interface AddressForm {
  saved: string; // label of the saved address picked, or NEW
  street: string;
  city: string;
  state: string;
  zip: string;
}

export const NEW_ADDRESS = 'New address';

export const emptyAddress = (zip = ''): AddressForm => ({ saved: NEW_ADDRESS, street: '', city: '', state: 'FL', zip });

interface AddressBlockProps {
  idPrefix: string;
  title: string;
  value: AddressForm;
  onChange: (v: AddressForm) => void;
}

// One address with a saved-address picker (GET /me/addresses). Picking one fills the fields.
export default function AddressBlock({ idPrefix, title, value, onChange }: AddressBlockProps) {
  const saved = useSavedAddresses();
  const set = (patch: Partial<AddressForm>) => onChange({ ...value, ...patch });

  const pick = (label: string) => {
    const a = saved.find((s) => s.label === label);
    if (!a) return onChange({ ...emptyAddress(value.zip), saved: NEW_ADDRESS });
    onChange({ saved: label, street: a.apt ? `${a.street} ${a.apt}` : a.street, city: a.city, state: a.state, zip: a.zip });
  };

  // Editing a field after picking a saved address makes it a one-off address.
  const edit = (patch: Partial<AddressForm>) => set({ ...patch, saved: NEW_ADDRESS });

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon name="MapPinIcon" size={18} variant="solid" className="text-accent" />
        {title}
      </p>
      <div className="space-y-3">
        {saved.length > 0 && (
          <div>
            <label htmlFor={`${idPrefix}-saved`} className="sr-only">
              Saved address
            </label>
            <Select
              id={`${idPrefix}-saved`}
              value={value.saved}
              onChange={pick}
              options={[...saved.map((s) => s.label ?? s.formatted), NEW_ADDRESS]}
              icon="HomeIcon"
            />
          </div>
        )}
        <div>
          <label htmlFor={`${idPrefix}-street`} className="mb-1 block text-xs font-medium text-foreground">
            Street address
          </label>
          <input
            id={`${idPrefix}-street`}
            autoComplete="street-address"
            className={inputCls}
            value={value.street}
            onChange={(e) => edit({ street: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <label htmlFor={`${idPrefix}-city`} className="mb-1 block text-xs font-medium text-foreground">
              City
            </label>
            <input
              id={`${idPrefix}-city`}
              autoComplete="address-level2"
              className={inputCls}
              value={value.city}
              onChange={(e) => edit({ city: e.target.value })}
            />
          </div>
          <div className="col-span-3">
            <span className="mb-1 block text-xs font-medium text-foreground">State / ZIP</span>
            <div className="grid grid-cols-2 gap-2">
              {/* South Florida only (README 12 #7) */}
              <Select id={`${idPrefix}-state`} value={value.state} onChange={(v) => edit({ state: v })} options={['FL']} />
              <input
                aria-label="ZIP code"
                autoComplete="postal-code"
                className={inputCls}
                value={value.zip}
                maxLength={5}
                inputMode="numeric"
                onChange={(e) => edit({ zip: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
