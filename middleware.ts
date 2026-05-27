import { NextResponse, type NextRequest } from 'next/server';

// Edge-safe gate. We deliberately do NOT run the Supabase SDK here: it was
// crashing Vercel's Edge runtime (MIDDLEWARE_INVOCATION_FAILED → every route
// 500'd). Real auth is enforced where it counts — every API route validates the
// session and returns 401, and the page layouts redirect via AuthContext. So the
// middleware only needs a cheap, synchronous first-line check: is a Supabase auth
// cookie present? If not, keep unauthenticated visitors out of the app shells.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // @supabase/ssr stores the session as `sb-<ref>-auth-token` (sometimes chunked
  // with .0/.1 suffixes). Presence ≈ logged in; validity is checked server-side.
  const hasSession = request.cookies.getAll().some((c) => c.name.includes('-auth-token'));

  if (!hasSession && (pathname.startsWith('/portal') || pathname.startsWith('/coach'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|pdfs|applogo.png).*)'],
};
