'use client';

import SectionCard from '@/app/book-service/components/SectionCard';
import Select from '@/app/book-service/components/Select';
import AddressBlock, { type AddressForm } from '@/app/book-service/components/AddressBlock';

export type { AddressForm } from '@/app/book-service/components/AddressBlock';

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