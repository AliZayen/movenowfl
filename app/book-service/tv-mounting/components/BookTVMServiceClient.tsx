'use client';

import React, { useCallback, useState } from 'react';
import type { BookingPrefill } from '@/app/book-service/prefill';
import DateTimeSection from '@/app/book-service/components/DateTimeSection';
import PhotosSection from '@/app/book-service/components/PhotosSection';
import JobAddress from '@/app/book-service/components/JobAdress';
import TVMSummarySidebar from '@/app/book-service/tv-mounting/components/TVMSummarySidebar';
import TVMountingDetails from '@/app/book-service/tv-mounting/components/TVMountingDetails';
import BookingFormShell, { location, missingField } from '@/app/book-service/components/BookingFormShell';
import { emptyAddress, type AddressForm } from '@/app/book-service/components/AddressBlock';
import { useSubmitBooking } from '@/app/book-service/components/useSubmitBooking';
import { BRACKETS, FLOORS, idOf, PARKING, TV_MOUNT_TYPES, TV_SIZES, WALL_TYPES } from '@/app/lib/catalog';
import { formatDate } from '@/app/lib/api/format';

interface BookTVMServiceClientProps {
  prefill?: BookingPrefill;
}

export default function BookTVMServiceClient({ prefill = {} }: BookTVMServiceClientProps) {
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

  // Form values are the labels shown in the dropdowns; idOf() turns them into API ids.
  const [type, setType] = useState('');
  const [tvSize, setTvSize] = useState('');
  const [wallType, setWallType] = useState('');
  const [bracket, setBracket] = useState('');
  const [power, setPower] = useState<'' | 'yes' | 'no'>('');
  const [notes, setNotes] = useState('');

  const details = {
    mountType: idOf(TV_MOUNT_TYPES, type),
    tvSize: idOf(TV_SIZES, tvSize),
    wallType: idOf(WALL_TYPES, wallType),
    bracket: idOf(BRACKETS, bracket),
    tvCount: 1,
    needsPowerOutlet: power === 'yes',
  };
  const detailsDone = !!(details.mountType && details.tvSize && details.wallType && details.bracket);
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
      [detailsDone, 'Choose the mounting type, TV size, wall type and bracket'],
      [!!dateValue, 'Pick a date'],
      [!!slot, 'Pick a time slot'],
    ]);
    if (missing) return setToast(missing);
    submit({ serviceType: 'tv_mounting', scheduledDate: dateValue, preferredSlot: slot, origin, details, notes: notes.trim() || undefined });
  };

  const summary = {
    date: formatDate(dateValue),
    fromZip: from.zip || '—',
    mountingType: type || '—',
    tvSize: tvSize,
    wallType: wallType,
  };

  return (
    <BookingFormShell
      service="TV Mounting"
      title="Book Your TV Mounting Service"
      subtitle="Tell us about your TV and wall and we'll match you with a trusted installer in Miami."
      estimatePayload={zipOk && detailsDone ? { serviceType: 'tv_mounting', origin: { zip: from.zip }, details } : null}
      estimateMissing="Enter the ZIP code and TV details to see a price."
      onSubmit={handleSubmit}
      busy={busy}
      busyLabel={progress}
      toast={toast}
      onCloseToast={closeToast}
      sidebar={<TVMSummarySidebar summary={summary} onNotify={setToast} />}
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
      <TVMountingDetails
        type={type}
        onType={setType}
        tvSize={tvSize}
        onTvSize={setTvSize}
        wallType={wallType}
        onWallType={setWallType}
        bracket={bracket}
        onBracket={setBracket}
        power={power}
        onPower={setPower}
        notes={notes}
        onNotes={setNotes}
      />
      <DateTimeSection service="tv_mounting" zip={from.zip} date={dateValue} onDate={setDateValue} slot={slot} onSlot={setSlot} />
      <PhotosSection photos={photos} onChange={setPhotos} onNotify={setToast} />
    </BookingFormShell>
  );
}
