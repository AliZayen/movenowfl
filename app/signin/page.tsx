import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SignInClient from '@/app/signin/SignInClient';

export const metadata: Metadata = { title: 'Sign in' };

// SignInClient reads ?next= and ?mode=, so it renders inside Suspense.
export default function SignInPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>}>
      <SignInClient />
    </Suspense>
  );
}
