'use client';

import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

export interface NotificationPrefs {
  booking: boolean;
  messages: boolean;
  promos: boolean;
  news: boolean;
}

interface NotificationsSectionProps {
  prefs: NotificationPrefs;
  onChange: (p: NotificationPrefs) => void;
}

const rows: { key: keyof NotificationPrefs; icon: string; title: string; desc: string }[] = [
  { key: 'booking', icon: 'HomeIcon', title: 'Booking updates', desc: 'Status changes, confirmations, cancellations' },
  { key: 'messages', icon: 'ChatBubbleOvalLeftEllipsisIcon', title: 'Messages', desc: 'New messages from service providers' },
  { key: 'promos', icon: 'TagIcon', title: 'Promotions & offers', desc: 'Special deals and discounts' },
  { key: 'news', icon: 'NewspaperIcon', title: 'News & updates', desc: 'Product updates and new services' },
];

export default function NotificationsSection({ prefs, onChange }: NotificationsSectionProps) {
  return (
    <ProfileCard id="notifications" icon="BellIcon" title="Notifications" subtitle="Choose what you want to be notified about.">
      <ul>
        {rows.map((r) => {
          const on = prefs[r.key];
          return (
            <li key={r.key} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-primary">
                <Icon name={r.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.title}
                onClick={() => onChange({ ...prefs, [r.key]: !on })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </ProfileCard>
  );
}
