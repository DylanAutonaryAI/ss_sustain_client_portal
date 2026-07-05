import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST-only: a state-changing GET here is a CSRF vector (a cross-site link or
// prefetch could force-log-out a user). The app signs out via the browser
// client (AuthContext) and doesn't call this route, so dropping GET is safe.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    status: 302,
  });
}
