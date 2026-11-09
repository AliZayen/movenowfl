'use client';

import Link from 'next/link';
import Icon from '@/app/components/ui/AppIcon';

// Floating "New booking" button on the customer's pages (RequireAuth renders it for customers only).
// Hidden on the booking pages themselves, where the customer is already booking.
// On Messages it sits higher, above the message box, so it never covers the Send button.
export default function NewBookingFab({ pathname }: { pathname: string }) {
  if (pathname === '/book-service' || pathname.startsWith('/book-service/')) return null;
  const raised = pathname === '/messages' || pathname.startsWith('/messages/');

  return (
    <Link
      href="/book-service"
      aria-label="New booking"
      title="New booking"
      className={`fixed right-4 z-30 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-bold text-accent-foreground shadow-pop transition-transform hover:scale-105 hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-95 sm:right-6 ${
        raised ? 'bottom-28 w-14' : 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] min-w-14 px-4 sm:px-5'
      }`}
    >
      <Icon name="PlusIcon" size={22} />
      {/* Icon only on phones and over a chat, so it covers as little as possible; aria-label names it. */}
      {!raised && <span className="hidden sm:inline">New booking</span>}
    </Link>
  );
}
