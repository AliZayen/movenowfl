'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';
import Select, { inputCls } from '@/app/book-service/components/Select';


type YesNoRadioProps = {
    name: string;
    value: 'yes' | 'no' | '';
    onChange: (v: 'yes' | 'no') => void;
    groupLabel: string;
  };
  
  export function YesNoRadio({ name, value, onChange, groupLabel }: YesNoRadioProps) {
    const options: { id: string; val: 'yes' | 'no'; label: string }[] = [
      { id: `${name}-yes`, val: 'yes', label: 'Yes' },
      { id: `${name}-no`, val: 'no', label: 'No' },
    ];
    return (
      <div role="radiogroup" aria-label={groupLabel} className="flex items-center gap-6">
        {options.map((o) => {
          const selected = value === o.val;
          return (
            <label
              key={o.id}
              htmlFor={o.id}
              className="group flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-navy"
            >
              <input
                id={o.id}
                type="radio"
                name={name}
                value={o.val}
                checked={selected}
                onChange={() => onChange(o.val)}
                className="peer sr-only"
              />
              <span
                className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/30 ${
                  selected ? 'border-accent bg-accent/10' : 'border-input bg-card group-hover:border-muted-foreground'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full bg-accent transition-transform duration-150 ${
                    selected ? 'scale-100' : 'scale-0'
                  }`}
                />
              </span>
              {o.label}
            </label>
          );
        })}
      </div>
    );
  }


interface FurnitureAssemblyDetailsProps{
    type: string;
    onType : (v: string) => void;
    brand: string;
    onBrand : (v: string) => void;
    model: string;
    onModel : (v: string) => void;
    haveInstructions: 'yes' | 'no' | '';
    onHaveInstructions : (v: 'yes' | 'no') => void;
    anchring: 'yes' | 'no' | '';
    onAnchring: (v: 'yes' | 'no') => void;
    notes: string;
    onNotes: (v: string) => void;

}

export default function FurnitureAssemblyDetails(props: FurnitureAssemblyDetailsProps){

    const { type, onType, brand, onBrand, model, onModel, haveInstructions, onHaveInstructions, anchring, onAnchring, notes, onNotes } = props;


    return (
        <SectionCard step={2} icon="CalendarDaysIcon" title="Booking Details" subtitle="Choose your booking details.">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Furniture Type
          </label>
          <Select 
            id="type"
            value={type}
            onChange={onType}
            options={['Bed frame', 'Dresser / chest of drawers', 'Wardrobe / armoire', 'Dining table', 'Desk / workstation', 'Bookcase / shelving unit', 'Sofa / sectional','Crib / nursery furniture', 'Patio / outdoor set', 'TV stand / media console']}
          /> 
        </div>
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Brand
          </label>
          <input
              id={"brand"}
              className={inputCls}
              value={brand}
              onChange={(e) => onBrand(e.target.value)}
            />
        </div>
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Model
          </label>
          <input
              id={"model"}
              className={inputCls}
              value={model}
              onChange={(e) => onModel(e.target.value)}
            />
        </div>
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Do you have assembly instructions?
          </label>
          <YesNoRadio 
          name="haveInstructions"
          groupLabel="Do you have assembly instructions?"
          value={haveInstructions}
          onChange={onHaveInstructions}
          />
        </div>
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Should anything be anchored to the wall?
          </label>
          <YesNoRadio 
          name="hasOutlet"
          groupLabel="Should anything be anchored to the wall?"
          value={anchring}
          onChange={onAnchring}
          />
        </div>
        <div>
          <label htmlFor="pref-date" className="mb-2 block text-sm font-semibold text-foreground">
          Anything else we should know?
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
        </div>
      </div>
    </SectionCard>
    );
}
