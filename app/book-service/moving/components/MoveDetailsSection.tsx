'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';
import Select, { inputCls } from '@/app/book-service/components/Select'

export interface AddressForm {
  saved: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface MoveDetailsSectionProps {
  from: AddressForm;
  to: AddressForm;
  onFromChange: (v: AddressForm) => void;
  onToChange: (v: AddressForm) => void;
  floor: string;
  onFloor: (v: string) => void;
  elevator: string;
  onElevator: (v: string) => void;
  parking: string;
  onParking: (v: string) => void;
  access: string;
  onAccess: (v: string) => void;
}

interface AddressBlockProps {
  idPrefix: string;
  title: string;
  value: AddressForm;
  onChange: (v: AddressForm) => void;
}

export function AddressBlock({ idPrefix, title, value, onChange }: AddressBlockProps) {
  const set = (patch: Partial<AddressForm>) => onChange({ ...value, ...patch });
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon name="MapPinIcon" size={18} variant="solid" className="text-accent" />
        {title}
      </p>
      <div className="space-y-3">
        <Select
          id={`${idPrefix}-saved`}
          value={value.saved}
          onChange={(v) => set({ saved: v })}
          options={['Home', 'Office', 'Gym', 'New address']}
          icon="HomeIcon"
        />
        <div>
          <label htmlFor={`${idPrefix}-street`} className="mb-1 block text-xs font-medium text-foreground">
            Street address
          </label>
          <input
            id={`${idPrefix}-street`}
            className={inputCls}
            value={value.street}
            onChange={(e) => set({ street: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <label htmlFor={`${idPrefix}-city`} className="mb-1 block text-xs font-medium text-foreground">
              City
            </label>
            <input
              id={`${idPrefix}-city`}
              className={inputCls}
              value={value.city}
              onChange={(e) => set({ city: e.target.value })}
            />
          </div>
          <div className="col-span-3">
            <span className="mb-1 block text-xs font-medium text-foreground">State / ZIP</span>
            <div className="grid grid-cols-2 gap-2">
              <Select
                id={`${idPrefix}-state`}
                value={value.state}
                onChange={(v) => set({ state: v })}
                options={['FL', 'GA', 'NY', 'TX', 'CA']}
              />
              <input
                aria-label="ZIP code"
                className={inputCls}
                value={value.zip}
                maxLength={5}
                inputMode="numeric"
                onChange={(e) => set({ zip: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MoveDetailsSection(props: MoveDetailsSectionProps) {
  const { from, to, onFromChange, onToChange, floor, onFloor, elevator, onElevator, parking, onParking, access, onAccess } =
    props;
  return (
    <SectionCard step={1} icon="HomeIcon" title="Move Details" subtitle="Where are you moving from and to?">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AddressBlock idPrefix="from" title="Moving from" value={from} onChange={onFromChange} />
        {(to != null && onToChange !=null) && <AddressBlock idPrefix="to" title="Moving to" value={to} onChange={onToChange} />}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="floor" className="mb-1 block text-xs font-medium text-foreground">Floor</label>
          <Select id="floor" value={floor} onChange={onFloor} options={['Ground', '2nd', '3rd', '4th', '5th+']} />
        </div>
        <div>
          <label htmlFor="elevator" className="mb-1 block text-xs font-medium text-foreground">Elevator</label>
          <Select id="elevator" value={elevator} onChange={onElevator} options={['Yes', 'No']} />
        </div>
        <div>
          <label htmlFor="parking" className="mb-1 block text-xs font-medium text-foreground">Parking availability</label>
          <Select
            id="parking"
            value={parking}
            onChange={onParking}
            options={['Street parking', 'Driveway', 'Loading dock', 'Garage']}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="access" className="mb-1 block text-xs font-medium text-foreground">
          Access instructions <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="access"
          rows={3}
          maxLength={200}
          value={access}
          onChange={(e) => onAccess(e.target.value)}
          placeholder="Gate code, building entry instructions, etc."
          className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="tabular mt-1 text-right text-xs text-muted-foreground">{access.length}/200</p>
      </div>
    </SectionCard>
  );
}
