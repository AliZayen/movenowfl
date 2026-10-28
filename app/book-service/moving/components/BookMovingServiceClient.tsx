'use client';

import type { BookingPrefill } from '@/app/book-service/prefill';
import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import Toast from '@/app/components/ui/Toast';
import MoveDetailsSection, { AddressForm } from '@/app/book-service/moving/components/MoveDetailsSection';
import ItemsSizeSection from '@/app/book-service/moving/components/ItemsSizeSection';
import DateTimeSection from '@/app/book-service/components/DateTimeSection';
import PhotosSection from '@/app/book-service/components/PhotosSection';
import SummarySidebar from '@/app/book-service/moving/components/SummarySidebar';

export const homeTypes = [
{ id: 'studio', label: 'Studio', range: '0 - 400 sqft' },
{ id: '1br', label: '1 Bedroom', range: '401 - 800 sqft' },
{ id: '2br', label: '2 Bedrooms', range: '801 - 1200 sqft' },
{ id: '3br', label: '3 Bedrooms', range: '1201 - 1800 sqft' },
{ id: '4br', label: '4+ Bedrooms', range: '1800+ sqft' }];


export const volumes = [
{ id: 'few', label: 'A few items' },
{ id: 'half', label: 'Half a truck' },
{ id: 'full', label: 'Full truck' },
{ id: 'unsure', label: 'Not sure' }];


interface BookMovingServiceClientProps {
  prefill?: BookingPrefill;
}

export default function BookMovingServiceClient({ prefill = {} }: BookMovingServiceClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const [from, setFrom] = useState<AddressForm>({
    saved: 'Home',
    street: '123 Ocean Dr',
    city: 'Miami',
    state: 'FL',
    zip: prefill.fromZip ?? '33101'
  });
  const [to, setTo] = useState<AddressForm>({
    saved: 'Home',
    street: '456 Brickell Ave',
    city: 'Miami',
    state: 'FL',
    zip: prefill.toZip ?? '33131'
  });
  const [floor, setFloor] = useState('Ground');
  const [elevator, setElevator] = useState('Yes');
  const [parking, setParking] = useState('Street parking');
  const [access, setAccess] = useState('');

  const [homeType, setHomeType] = useState('1br');
  const [volume, setVolume] = useState('full');
  const [specials, setSpecials] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [dateValue, setDateValue] = useState(prefill.date ?? '2026-10-30');
  const [slot, setSlot] = useState('10:00 AM');

  const summary = useMemo(() => {
    const ht = homeTypes.find((h) => h.id === homeType);
    const vol = volumes.find((v) => v.id === volume);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [yy, mm, dd] = dateValue.split('-').map(Number);
    const dateLabel = yy && mm && dd ? `${months[mm - 1]} ${dd}, ${yy}` : '—';
    return {
      date: dateLabel,
      fromZip: from.zip || '—',
      toZip: to.zip || '—',
      homeSize: ht?.label.replace('Bedrooms', 'Bedrooms') ?? '—',
      moveSize: vol?.label ?? '—'
    };
  }, [homeType, volume, dateValue, from.zip, to.zip]);

  const handleNext = () => {
    if (!from.street.trim() || !to.street.trim()) {
      setToast('Please enter both street addresses to continue');
      return;
    }
    setToast('Move details saved — a pro will confirm your quote shortly');
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-primary">
        <button
          type="button"
          onClick={() => router?.push('/')}
          aria-label="Back to dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-secondary">
          
          <Icon name="ArrowLeftIcon" size={16} />
        </button>
        <Link href="/" className="hover:text-accent">Dashboard</Link>
        <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
        <Link href="/book-service" className="hover:text-accent">Book a Service</Link>
        <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
        <span className="font-semibold">Moving</span>
      </nav>

      <div className="relative overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Book Your Moving Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us about your move and we&apos;ll match you with the best professionals in Miami.
            </p>
          </div>
          <div className="relative h-40 w-full overflow-hidden rounded-xl lg:h-36">
            <AppImage
              src="https://img.rocket.new/generatedImages/rocket_gen_img_1ecfd21dc-1770563465669.png"
              alt="White MoveNow moving truck parked outside a Miami apartment building with movers carrying boxes"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover" />
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
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
            onAccess={setAccess} />
          
          <ItemsSizeSection
            homeType={homeType}
            onHomeType={setHomeType}
            volume={volume}
            onVolume={setVolume}
            specials={specials}
            onSpecials={setSpecials}
            notes={notes}
            onNotes={setNotes} />
          
          <DateTimeSection date={dateValue} onDate={setDateValue} slot={slot} onSlot={setSlot} />
          <PhotosSection onNotify={setToast} />

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <button
              type="button"
              onClick={() => router?.push('/')}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-accent hover:text-accent active:scale-95">
              
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3 text-sm font-bold text-accent-foreground transition-all hover:opacity-90 active:scale-95">
              
              Next <Icon name="ArrowRightIcon" size={16} />
            </button>
          </div>
        </div>

        <aside className="xl:col-span-4">
          <SummarySidebar summary={summary} onNotify={setToast} />
        </aside>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>);

}