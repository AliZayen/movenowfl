import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Reset password' };

type Props = PageProps<'/reset-password'>;

// Password reset now uses a 6-digit email code, entered on the sign-in page. This path stays so old
// bookmarks and links keep working: /reset-password?email=… opens the code step for that email.
async function Go({ searchParams }: Pick<Props, 'searchParams'>) {
  const { email } = await searchParams;
  const target = typeof email === 'string' && email ? `/signin?mode=reset&email=${encodeURIComponent(email)}` : '/signin?mode=forgot';
  redirect(target);
  return null;
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>}>
      <Go searchParams={searchParams} />
    </Suspense>
  );
}
