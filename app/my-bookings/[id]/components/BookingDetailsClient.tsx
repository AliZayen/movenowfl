'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import AppImage from '@/app/components/ui/AppImage';
import Avatar from '@/app/components/ui/Avatar';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Toast from '@/app/components/ui/Toast';
import EmptyState from '@/app/components/ui/EmptyState';
import { bookings, BookingStatus } from '@/app/data/mockData';
import DetailsTabs from '@/app/my-bookings/[id]/components/DetailsTabs';
import BookingProgress from '@/app/my-bookings/[id]/components/BookingProgress';
import DetailsSidebar from '@/app/my-bookings/[id]/components/DetailsSidebar';

interface BookingDetailsClientProps {
  bookingId: string;
}

const gallery = [
{
  src: "https://images.unsplash.com/photo-1619217705977-b64a333616c5",
  alt: 'Large wall-mounted TV above a wooden media console in a bright living room with potted plants'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1feeceb00-1772172812997.png",
  alt: 'Flat screen television mounted on a white wall in a modern room'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_199e00e18-1772962770397.png",
  alt: 'Living room with grey sofa and cardboard boxes ready for installation'
}];


export default function BookingDetailsClient({ bookingId }: BookingDetailsClientProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const base = bookings.find((b) => b.id === bookingId || b.ref === bookingId);
  const [status, setStatus] = useState<BookingStatus | null>(null);

  if (!base) {
    return (
      <div className="space-y-4">
        <Link href="/my-bookings" className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent">
          <Icon name="ArrowLeftIcon" size={16} /> Back to My Bookings
        </Link>
        <EmptyState
          icon="CalendarDaysIcon"
          title="Booking not found"
          description="We couldn't find that booking. Head back to your bookings to pick another one." />
        
      </div>);

  }

  const current: BookingStatus = status ?? base.status;
  const cancelled = current === 'Cancelled';
  const cancel = () => {
    setStatus('Cancelled');
    setToast(`Booking ${base.ref} was cancelled`);
  };

  return (
    <div className="space-y-6">
      <Link href="/my-bookings" className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent">
        <Icon name="ArrowLeftIcon" size={16} /> Back to My Bookings
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon name="ComputerDesktopIcon" size={28} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-primary">{base.service}</h1>
                    <StatusBadge status={current} />
                  </div>
                  <p className="tabular mt-1 text-xs text-muted-foreground">
                    #{base.ref.replace('MN-2025-', 'BK-')} • Booked on Oct 29, 2026
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setToast(`Message opened with ${base.provider.name}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:border-accent hover:text-accent">
                  
                  <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={16} /> Message
                </button>
                <button
                  type="button"
                  disabled={cancelled}
                  onClick={cancel}
                  className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2.5 text-xs font-bold text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40">
                  
                  <Icon name="XCircleIcon" size={16} /> Cancel Booking
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <div className="relative h-60 overflow-hidden rounded-xl bg-muted sm:h-72">
                  <AppImage src={gallery[0].src} alt={gallery[0].alt} fill sizes="(max-width: 1024px) 70vw, 380px" className="object-cover" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-primary/70 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    <Icon name="PhotoIcon" size={12} /> 3 photos
                  </span>
                </div>
                <div className="grid grid-rows-2 gap-3">
                  {gallery.slice(1).map((g) =>
                  <div key={g.src} className="relative overflow-hidden rounded-xl bg-muted">
                      <AppImage src={g.src} alt={g.alt} fill sizes="96px" className="object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                <InfoRow icon="CalendarDaysIcon" label="Date" value="Oct 29, 2026" />
                <InfoRow icon="ClockIcon" label="Time" value="2:00 PM – 4:00 PM" />
                <InfoRow icon="MapPinIcon" label="Service address" value="456 Brickell Ave, Miami, FL, 33131" />
                <InfoRow icon="UserIcon" label="Service type" value={base.service} />
                <InfoRow icon="ClockIcon" label="Duration" value="1.5 hours" />
                <li className="flex gap-3">
                  <Icon name="UserIcon" size={18} className="mt-1 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Technician</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar src={base.provider.avatar} alt={base.provider.avatarAlt} size={36} />
                      <div>
                        <p className="text-xs font-bold text-foreground">{base.provider.name}</p>
                        <p className="tabular flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Icon name="StarIcon" size={12} variant="solid" className="text-accent" />
                          4.8 (96 jobs)
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <DetailsTabs onNotify={setToast} />
          <BookingProgress cancelled={cancelled} />
        </div>

        <aside className="xl:col-span-4">
          <DetailsSidebar
            service={base.service}
            cancelled={cancelled}
            onCancel={cancel}
            onModify={() => setToast('Modify request started — changes allowed up to 24 hours before')}
            onNotify={setToast}
            onProfile={() => router?.push('/profile')} />
          
        </aside>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </div>);

}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <li className="flex gap-3">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="tabular text-sm font-semibold text-foreground">{value}</p>
      </div>
    </li>);

}