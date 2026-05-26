import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

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
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|pdfs|applogo.png).*)'],
};
