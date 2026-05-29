import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Server-validated identity for the client AuthContext. The SERVER getUser()
// validates the access token from the cookie session against the Auth API — it
// does NOT depend on the browser's client-side refresh-token grant, which can
// fail after the API-key migration and leave getSession() returning null (the
// "Good morning, there." / "Client"/"??" fallback bug). This is the SAME check
// the route guards in app/portal|coach/layout.tsx already pass, so it's a
// reliable way for the browser to recover its profile.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null });

  const [{ data: role }, { data: profile }] = await Promise.all([
    supabase.rpc('get_my_role'),
    supabase.from('profiles').select('full_name, avatar_url, nickname').eq('id', user.id).maybeSingle(),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      role: role === 'coach' || role === 'client' ? role : null,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      nickname: profile?.nickname ?? null,
    },
  });
}
