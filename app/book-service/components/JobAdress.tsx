'use client';

import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';
import { inputCls } from './Select';

export interface AddressForm {
  saved: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface SelectProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: string;
}

interface JobAddressProps {
  from: AddressForm;
  onFromChange: (v: AddressForm) => void;
  floor: string;
  onFloor: (v: string) => void;
  elevator: string;
  onElevator: (v: string) => void;
  parking: string;
  onParking: (v: string) => void;
  access: string;
  onAccess: (v: string) => void;
}

function Select({ id, value, onChange, options, icon }: SelectProps) {
  return (
    <div className="relative">
      {icon && (
        <Icon name={icon} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-9 ${icon ? 'pl-10' : ''}`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Icon
        name="ChevronDownIcon"
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
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
  

export default function JobAddress(props : JobAddressProps){
  const { from, onFromChange, floor, onFloor, elevator, onElevator, parking, onParking, access, onAccess } =
    props;
    return (
        <SectionCard step={1} icon="HomeIcon" title="Job Address" subtitle="your address informations">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
        <AddressBlock idPrefix="from" title="Job address" value={from} onChange={onFromChange} />
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
    )
}