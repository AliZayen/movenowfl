'use client';

import React from 'react';
import PromoBanner from '@/app/my-bookings/components/PromoBanner';
import RecentMessages from '@/app/dashboard/components/RecentMessages';

interface RightRailProps {
  onBook: () => void;
  onNotify: (msg: string) => void;
}

// Kept short on purpose: the list and status tabs already show booking counts and details.
export default function RightRail({ onBook, onNotify }: RightRailProps) {
  return (
    <div className="space-y-5">
      <PromoBanner onBook={onBook} />
      <RecentMessages onNotify={onNotify} />
    </div>
  );
}
