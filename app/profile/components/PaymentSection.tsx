'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface PaymentSectionProps {
  onNotify: (msg: string) => void;
}

export default function PaymentSection({ onNotify }: PaymentSectionProps) {
  return (
    <ProfileCard
      id="payments"
      icon="CreditCardIcon"
      title="Payment Methods"
      subtitle="Manage your saved payment methods for faster booking."
    >
      {/* TODO: Stripe saved cards (README phase 5). */}
      <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-5">
        <Icon name="CreditCardIcon" size={32} className="shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Saved cards are coming soon</p>
          <p className="text-xs text-muted-foreground">For now, your pro collects payment when the job is done.</p>
        </div>
        <button
          type="button"
          onClick={() => onNotify("We'll let you know when you can save a card")}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-muted"
        >
          Notify me
        </button>
      </div>
    </ProfileCard>
  );
}
