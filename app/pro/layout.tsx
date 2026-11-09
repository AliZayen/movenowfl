import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppLayout from '@/app/components/AppLayout';
import { getSession } from '@/app/lib/server/auth';
import { db } from '@/app/lib/server/db';

export const metadata: Metadata = {
  title: { default: 'My jobs', template: '%s · MoveNow Pro' },
  robots: { index: false, follow: false },
};

// The provider area. Checked on the server before anything renders: only a `provider` account
// linked to an active provider profile gets in; everyone else sees the normal 404 (like /admin).
// The API scopes every booking and conversation to the provider again, so this is not what
// protects the data.
async function ProviderGate({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== 'provider') notFound();
  const provider = await db.provider.findUnique({ where: { userId: session.user.id }, select: { active: true } });
  if (!provider?.active) notFound();
  return <>{children}</>;
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>}>
        <ProviderGate>{children}</ProviderGate>
      </Suspense>
    </AppLayout>
  );
}
