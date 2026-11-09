import React, { Suspense } from 'react';
import { connection } from 'next/server';
import AppLayout from '@/app/components/AppLayout';
import BookFAServiceClient from '@/app/book-service/furniture-assembly/components/BookFAServiceClient';
import { readPrefill } from '@/app/book-service/prefill';
import { addDays, todayInFlorida } from '@/app/lib/server/time';

type Props = PageProps<'/book-service/furniture-assembly'>;

// Reads the URL (?fromZip, ?toZip, ?date) inside Suspense so the rest of the page can prerender.
async function Form({ searchParams }: Pick<Props, 'searchParams'>) {
  await connection(); // reads today's date, so render per request
  const prefill = readPrefill(await searchParams);
  prefill.date ??= addDays(todayInFlorida(), 1); // default: tomorrow, Florida time
  return <BookFAServiceClient prefill={prefill} />;
}

export default function FurnitureAssemblyPage({ searchParams }: Props) {
  return (
    <AppLayout>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AppLayout>
  );
}
