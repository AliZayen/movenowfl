import { NextResponse, type NextRequest } from 'next/server';

// Optimistic check only: no session cookie → sign-in page. The API still verifies the session on
// every request, and RequireAuth (in AppLayout) handles cookies that have expired.
// /admin without a cookie answers 404 instead of a sign-in redirect, so it doesn't advertise itself;
// staff sign in on /signin. Signed-in non-staff get the same 404 from the admin layout.
const SESSION_COOKIE = 'mn_session';

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/_admin-not-found', request.url), { status: 404 });
  }
  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = '/signin';
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/my-bookings/:path*', '/messages/:path*', '/profile/:path*', '/book-service/:path*', '/admin/:path*', '/pro/:path*'],
};
