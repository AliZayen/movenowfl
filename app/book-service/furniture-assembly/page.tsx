import React, { Suspense } from 'react';
import AppLayout from '@/app/components/AppLayout';
import BookFAServiceClient from '@/app/book-service/furniture-assembly/components/BookFAServiceClient';
import { readPrefill } from '@/app/book-service/prefill';

type Props = PageProps<'/book-service/furniture-assembly'>;

// Reads the URL (?fromZip, ?toZip, ?date) inside Suspense so the rest of the page can prerender.
async function Form({ searchParams }: Pick<Props, 'searchParams'>) {
  const prefill = readPrefill(await searchParams);
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
