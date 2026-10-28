'use client';

import React from 'react';
import PromoBanner from '@/app/my-bookings/components/PromoBanner';
import MiniStats from '@/app/my-bookings/components/MiniStats';
import RailTabs from '@/app/my-bookings/components/RailTabs';
import QuickActionsGrid from '@/app/components/QuickActionsGrid';

interface RightRailProps {
  onBook: () => void;
}

export default function RightRail({ onBook }: RightRailProps) {
  return (
    <div className="space-y-5">
      <PromoBanner onBook={onBook} />
      <MiniStats />
      <RailTabs />
      <QuickActionsGrid onBook={onBook} compact />
    </div>
  );
}