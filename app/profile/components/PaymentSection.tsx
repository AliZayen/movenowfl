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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onNotify('Add payment method (demo)')}
          className="flex items-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-5 text-left transition-colors hover:border-accent/50"
        >
          <Icon name="PlusCircleIcon" size={36} className="text-muted-foreground" />
          <span>
            <span className="block text-xs font-semibold text-foreground">Add Payment Method</span>
            <span className="block text-[11px] text-muted-foreground">Credit card, debit card, or Apple Pay</span>
          </span>
        </button>
        <div className="flex items-center gap-4 rounded-xl border border-border p-5">
          <span className="rounded-md bg-primary px-2 py-1.5 text-[11px] font-extrabold italic text-primary-foreground">VISA</span>
          <div className="flex-1">
            <p className="tabular text-sm font-semibold text-foreground">•••• 4242</p>
            <p className="tabular text-[11px] text-muted-foreground">Expires 05/28</p>
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">Default</span>
          <button
            type="button"
            aria-label="Card options"
            onClick={() => onNotify('Card options (demo)')}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <Icon name="EllipsisVerticalIcon" size={18} />
          </button>
        </div>
      </div>
    </ProfileCard>
  );
}
