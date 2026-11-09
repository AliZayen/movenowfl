'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { BookingPrefill } from '@/app/book-service/prefill';
import MoveDetailsSection from '@/app/book-service/moving/components/MoveDetailsSection';
import ItemsSizeSection from '@/app/book-service/moving/components/ItemsSizeSection';
import DateTimeSection from '@/app/book-service/components/DateTimeSection';
import PhotosSection from '@/app/book-service/components/PhotosSection';
import SummarySidebar from '@/app/book-service/moving/components/SummarySidebar';
import BookingFormShell, { location, missingField } from '@/app/book-service/components/BookingFormShell';
import { emptyAddress, type AddressForm } from '@/app/book-service/components/AddressBlock';
import { useSubmitBooking } from '@/app/book-service/components/useSubmitBooking';
import { FLOORS, HOME_SIZES, idOf, MOVE_VOLUMES, PARKING, SPECIAL_ITEMS } from '@/app/lib/catalog';
import { formatDate } from '@/app/lib/api/format';

interface BookMovingServiceClientProps {
  prefill?: BookingPrefill;
}

const zipOk = (zip: string) => /^\d{5}$/.test(zip);

export default function BookMovingServiceClient({ prefill = {} }: BookMovingServiceClientProps) {
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const { submit, busy, progress, photos, setPhotos } = useSubmitBooking(setToast);

  const [from, setFrom] = useState<AddressForm>(emptyAddress(prefill.fromZip));
  const [to, setTo] = useState<AddressForm>(emptyAddress(prefill.toZip));
  const [floor, setFloor] = useState('Ground');
  const [elevator, setElevator] = useState('Yes');
  const [parking, setParking] = useState('Street parking');
  const [access, setAccess] = useState('');

  const [homeType, setHomeType] = useState<string>('1br');
  const [volume, setVolume] = useState('full');
  const [specials, setSpecials] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [dateValue, setDateValue] = useState(prefill.date ?? '');
  const [slot, setSlot] = useState('');

  // The body for POST /bookings (and POST /quotes/estimate).
  const body = useMemo(
    () => ({
      serviceType: 'moving' as const,
      scheduledDate: dateValue,
      preferredSlot: slot,
      origin: location(from, {
        floor: idOf(FLOORS, floor),
        elevator: elevator === 'Yes',
        parking: idOf(PARKING, parking),
        accessNotes: access.trim() || undefined,
      }),
      destination: location(to),
      details: {
        homeSize: homeType,
        volume,
        specialItems: specials.map((s) => idOf(SPECIAL_ITEMS, s)).filter(Boolean),
      },
      extraServices: [],
      notes: notes.trim() || undefined,
    }),
    [from, to, floor, elevator, parking, access, homeType, volume, specials, notes, dateValue, slot],
  );

  // Price only depends on the details, ZIPs and access, so estimate as soon as both ZIPs are in.
  const estimatePayload =
    zipOk(from.zip) && zipOk(to.zip)
      ? {
          serviceType: body.serviceType,
          origin: { zip: from.zip, floor: body.origin.floor, elevator: body.origin.elevator },
          destination: { zip: to.zip },
          details: body.details,
          extraServices: body.extraServices,
        }
      : null;

  const handleSubmit = () => {
    const missing = missingField([
      [!!from.street.trim() && !!from.city.trim() && zipOk(from.zip), 'Enter the full address you are moving from'],
      [!!to.street.trim() && !!to.city.trim() && zipOk(to.zip), 'Enter the full address you are moving to'],
      [!!dateValue, 'Pick a move date'],
      [!!slot, 'Pick a time slot'],
    ]);
    if (missing) return setToast(missing);
    submit(body);
  };

  const summary = {
    date: formatDate(dateValue),
    fromZip: from.zip || '—',
    toZip: to.zip || '—',
    homeSize: HOME_SIZES.find((h) => h.id === homeType)?.label ?? '—',
    moveSize: MOVE_VOLUMES.find((v) => v.id === volume)?.label ?? '—',
  };

  return (
    <BookingFormShell
      service="Moving"
      title="Book Your Moving Service"
      subtitle="Tell us about your move and we'll match you with the best professionals in Miami."
      estimatePayload={estimatePayload}
      estimateMissing="Enter both ZIP codes to see a price."
      onSubmit={handleSubmit}
      busy={busy}
      busyLabel={progress}
      toast={toast}
      onCloseToast={closeToast}
      sidebar={<SummarySidebar summary={summary} onNotify={setToast} />}
    >
      <MoveDetailsSection
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        floor={floor}
        onFloor={setFloor}
        elevator={elevator}
        onElevator={setElevator}
        parking={parking}
        onParking={setParking}
        access={access}
        onAccess={setAccess}
      />
      <ItemsSizeSection
        homeType={homeType}
        onHomeType={setHomeType}
        volume={volume}
        onVolume={setVolume}
        specials={specials}
        onSpecials={setSpecials}
        notes={notes}
        onNotes={setNotes}
      />
      <DateTimeSection service="moving" zip={from.zip} date={dateValue} onDate={setDateValue} slot={slot} onSlot={setSlot} />
      <PhotosSection photos={photos} onChange={setPhotos} onNotify={setToast} />
    </BookingFormShell>
  );
}
