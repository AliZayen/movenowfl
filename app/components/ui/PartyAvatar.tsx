import React from 'react';
import Avatar from '@/app/components/ui/Avatar';
import Icon from '@/app/components/ui/AppIcon';
import { initials } from '@/app/lib/api/format';
import type { ApiConversation } from '@/app/lib/api/types';

// Avatar for the other side of a conversation: photo, MoveNow support badge, or initials.
export default function PartyAvatar({ party, size = 44 }: { party: ApiConversation['otherParty']; size?: number }) {
  if (party.avatarUrl) return <Avatar src={party.avatarUrl} alt={party.avatarAlt ?? party.name} size={size} />;
  const box = { width: size, height: size };
  if (party.kind === 'support') {
    return (
      <span aria-hidden style={box} className="flex shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
        <Icon name="LifebuoyIcon" size={Math.round(size * 0.5)} />
      </span>
    );
  }
  return (
    <span aria-hidden style={box} className="flex shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
      {initials(party.name)}
    </span>
  );
}
