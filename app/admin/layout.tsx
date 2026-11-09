import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminShell from '@/app/admin/components/AdminShell';
import { getSession } from '@/app/lib/server/auth';
import { can } from '@/app/lib/staff';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · MoveNow Admin' },
  robots: { index: false, follow: false },
};

// Checked on the server before anything renders: anyone who isn't active staff gets the normal 404
// page. (Signed-out visitors never get here; proxy.ts answers 404 first.) Each admin API route checks
// its own permission again, so hiding a link is never what protects data.
async function StaffGate({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !can(session.user, 'overview.view')) notFound();
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>}>
      <StaffGate>{children}</StaffGate>
    </Suspense>
  );
}
