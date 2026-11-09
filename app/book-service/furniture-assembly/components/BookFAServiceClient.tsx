'use client';

import React, { useCallback, useState } from 'react';
import type { BookingPrefill } from '@/app/book-service/prefill';
import DateTimeSection from '@/app/book-service/components/DateTimeSection';
import PhotosSection from '@/app/book-service/components/PhotosSection';
import JobAddress from '@/app/book-service/components/JobAdress';
import FASummarySidebar from '@/app/book-service/furniture-assembly/components/FASummarySidebar';
import FurnitureAssemblyDetails from '@/app/book-service/furniture-assembly/components/FurnitureAssemblyDetails';
import BookingFormShell, { location, missingField } from '@/app/book-service/components/BookingFormShell';
import { emptyAddress, type AddressForm } from '@/app/book-service/components/AddressBlock';
import { useSubmitBooking } from '@/app/book-service/components/useSubmitBooking';
import { FLOORS, FURNITURE_TYPES, idOf, PARKING } from '@/app/lib/catalog';
import { formatDate } from '@/app/lib/api/format';

interface BookFAServiceClientProps {
  prefill?: BookingPrefill;
}

export default function BookFAServiceClient({ prefill = {} }: BookFAServiceClientProps) {
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const { submit, busy, progress, photos, setPhotos } = useSubmitBooking(setToast);

  const [from, setFrom] = useState<AddressForm>(emptyAddress(prefill.fromZip));
  const [floor, setFloor] = useState('Ground');
  const [elevator, setElevator] = useState('Yes');
  const [parking, setParking] = useState('Street parking');
  const [access, setAccess] = useState('');

  const [dateValue, setDateValue] = useState(prefill.date ?? '');
  const [slot, setSlot] = useState('');

  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [haveInstructions, setHaveInstructions] = useState<'' | 'yes' | 'no'>('');
  const [anchring, setAnchring] = useState<'' | 'yes' | 'no'>('');
  const [notes, setNotes] = useState('');

  const furnitureType = idOf(FURNITURE_TYPES, type);
  const details = {
    furnitureType,
    brand: brand.trim() || undefined,
    model: model.trim() || undefined,
    itemCount: 1,
    hasInstructions: haveInstructions ? haveInstructions === 'yes' : undefined,
    needsWallAnchoring: anchring === 'yes',
  };
  const zipOk = /^\d{5}$/.test(from.zip);

  const origin = location(from, {
    floor: idOf(FLOORS, floor),
    elevator: elevator === 'Yes',
    parking: idOf(PARKING, parking),
    accessNotes: access.trim() || undefined,
  });

  const handleSubmit = () => {
    const missing = missingField([
      [!!from.street.trim() && !!from.city.trim() && zipOk, 'Enter the full job address'],
      [!!furnitureType, 'Choose the furniture type'],
      [!!dateValue, 'Pick a date'],
      [!!slot, 'Pick a time slot'],
    ]);
    if (missing) return setToast(missing);
    submit({ serviceType: 'furniture_assembly', scheduledDate: dateValue, preferredSlot: slot, origin, details, notes: notes.trim() || undefined });
  };

  const summary = {
    date: formatDate(dateValue),
    fromZip: from.zip || '—',
    brandModel: [brand, model].filter(Boolean).join(' ') || '—',
  };

  return (
    <BookingFormShell
      service="Furniture Assembly"
      title="Book Your Furniture Assembly Service"
      subtitle="Tell us what needs building and we'll match you with a trusted pro in Miami."
      estimatePayload={zipOk && furnitureType ? { serviceType: 'furniture_assembly', origin: { zip: from.zip }, details } : null}
      estimateMissing="Enter the ZIP code and furniture type to see a price."
      onSubmit={handleSubmit}
      busy={busy}
      busyLabel={progress}
      toast={toast}
      onCloseToast={closeToast}
      sidebar={<FASummarySidebar summary={summary} onNotify={setToast} />}
    >
      <JobAddress
        from={from}
        onFromChange={setFrom}
        floor={floor}
        onFloor={setFloor}
        elevator={elevator}
        onElevator={setElevator}
        parking={parking}
        onParking={setParking}
        access={access}
        onAccess={setAccess}
      />
      <FurnitureAssemblyDetails
        type={type}
        onType={setType}
        brand={brand}
        onBrand={setBrand}
        model={model}
        onModel={setModel}
        haveInstructions={haveInstructions}
        onHaveInstructions={setHaveInstructions}
        anchring={anchring}
        onAnchring={setAnchring}
        notes={notes}
        onNotes={setNotes}
      />
      <DateTimeSection service="furniture_assembly" zip={from.zip} date={dateValue} onDate={setDateValue} slot={slot} onSlot={setSlot} />
      <PhotosSection photos={photos} onChange={setPhotos} onNotify={setToast} />
    </BookingFormShell>
  );
}
