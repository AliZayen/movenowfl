import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import ProJobClient from '@/app/pro/components/ProJobClient';

export const metadata: Metadata = { title: 'Job details' };

type Props = PageProps<'/pro/jobs/[id]'>;

// Reads the [id] param inside Suspense so the layout around it can prerender.
async function Job({ params }: Pick<Props, 'params'>) {
  const { id } = await params;
  return <ProJobClient id={id} />;
}

export default function ProJobPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
      <Job params={params} />
    </Suspense>
  );
}
