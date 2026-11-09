import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import MessagesClient from '@/app/messages/components/MessagesClient';

// One page for /messages and /messages/<conversationId>, so the conversation list stays mounted
// while you switch threads. MessagesClient reads the id with useParams, inside Suspense.
export default function MessagesPage() {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
        <MessagesClient />
      </Suspense>
    </AppLayout>
  );
}
