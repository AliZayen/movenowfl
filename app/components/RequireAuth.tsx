'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/app/components/SessionProvider';
import NewBookingFab from '@/app/components/NewBookingFab';

// proxy.ts only checks that a session cookie exists. If the server says the session is gone
// (expired or signed out elsewhere), send the user to sign in and bring them back afterwards.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'guest') return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/signin?next=${encodeURIComponent(next)}`);
  }, [status, router]);

  if (status === 'loading' || status === 'guest') return status === 'loading' ? <Loading /> : null;
  // Reads the URL, so it sits in its own Suspense boundary (Cache Components). Nothing above is
  // prerendered past "Loading…" anyway, since the session is only known in the browser.
  return (
    <Suspense fallback={<Loading />}>
      <AreaGuard>{children}</AreaGuard>
    </Suspense>
  );
}

const Loading = () => <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>;

// Each role works in its own area. Customer pages (dashboard, My Bookings, booking a service) are for
// customers only; pros and staff are sent to their home instead. Messages and Profile are shared.
// The provider and admin areas also check the role on the server (their layouts answer 404), and the
// API scopes every request again, so this is navigation, not what protects data.
const AREAS = {
  provider: { home: '/pro', allowed: ['/pro', '/messages', '/profile'] },
  admin: { home: '/admin', allowed: ['/messages', '/profile'] },
} as const;

const within = (path: string, prefixes: readonly string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

function AreaGuard({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const area = user && user.role !== 'customer' ? AREAS[user.role] : null;
  const home = area && !within(pathname, area.allowed) ? area.home : null;

  useEffect(() => {
    if (home) router.replace(home);
  }, [home, router]);

  // Show nothing while redirecting, so another role's page never flashes on screen.
  if (home) return <Loading />;
  return (
    <>
      {children}
      {user?.role === 'customer' && <NewBookingFab pathname={pathname} />}
    </>
  );
}
