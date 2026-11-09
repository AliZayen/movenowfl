'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Icon from '@/app/components/ui/AppIcon';
import ConversationList from '@/app/messages/components/ConversationList';
import ConversationThread from '@/app/messages/components/ConversationThread';
import { useConversations } from '@/app/lib/api/messaging';

// Two panes on large screens (list + thread). On smaller screens you see one at a time:
// the list at /messages, the thread at /messages/<id> with a back button.
export default function MessagesClient() {
  const params = useParams<{ id?: string[] }>();
  const selectedId = params.id?.[0] ?? null;
  const list = useConversations();

  return (
    <div className="space-y-5">
      <div className={selectedId ? 'hidden lg:block' : undefined}>
        <h1 className="text-2xl font-extrabold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chat with your pros about your bookings.</p>
      </div>

      <div className="grid h-[calc(100dvh-13rem)] min-h-[480px] grid-cols-1 grid-rows-1 overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div className={`min-h-0 border-border lg:border-r ${selectedId ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <ConversationList
            items={list.data?.items}
            loading={list.loading && !list.data}
            error={list.error?.message}
            onRetry={list.reload}
            selectedId={selectedId}
          />
        </div>

        <div className={`min-h-0 flex-col ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
          {selectedId ? (
            <ConversationThread key={selectedId} conversationId={selectedId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
                <Icon name="ChatBubbleLeftRightIcon" size={28} />
              </span>
              <p className="mt-3 text-base font-bold text-foreground">Pick a conversation</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Choose one on the left to read and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
