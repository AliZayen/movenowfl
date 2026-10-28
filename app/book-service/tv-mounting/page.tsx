import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookTVMServiceClient from '@/app/book-service/tv-mounting/components/BookTVMServiceClient';
import { readPrefill } from '@/app/book-service/prefill';

type Props = PageProps<'/book-service/tv-mounting'>;

// Reads the URL (?fromZip, ?toZip, ?date) inside Suspense so the rest of the page can prerender.
async function Form({ searchParams }: Pick<Props, 'searchParams'>) {
  const prefill = readPrefill(await searchParams);
  return <BookTVMServiceClient prefill={prefill} />;
}

export default function TVMountingPage({ searchParams }: Props) {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AppLayout>
  );
}
