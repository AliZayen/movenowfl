import React, { Suspense } from 'react';
import ProJobsClient from '@/app/pro/components/ProJobsClient';

export default function ProJobsPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>}>
      <ProJobsClient />
    </Suspense>
  );
}
