import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail OPEN if the auth check can't run, instead of 500-ing every route
  // (MIDDLEWARE_INVOCATION_FAILED takes the whole site down). The pages and API
  // routes enforce auth themselves, so worst case is a brief unprotected nav,
  // not a data leak. Anything thrown here is swallowed and the request proceeds.
  if (!url || !key) return supabaseResponse;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // Unauthenticated: redirect to login
    if (!user) {
      if (pathname.startsWith('/portal') || pathname.startsWith('/coach')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return supabaseResponse;
    }

    // Authenticated: check role for coach routes
    if (pathname.startsWith('/coach')) {
      const { data: role } = await supabase.rpc('get_my_role');
      if (role !== 'coach') {
        return NextResponse.redirect(new URL('/portal/home', request.url));
      }
    }

    // Redirect root / and /login to correct dashboard
    if (pathname === '/login' || pathname === '/') {
      const { data: role } = await supabase.rpc('get_my_role');
      const dest = role === 'coach' ? '/coach/overview' : '/portal/home';
      return NextResponse.redirect(new URL(dest, request.url));
    }

    return supabaseResponse;
  } catch {
    // Never crash the edge — let the request through; client/API enforce auth.
    return supabaseResponse;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|pdfs|applogo.png).*)'],
};
