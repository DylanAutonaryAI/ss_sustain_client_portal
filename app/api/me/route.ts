import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Server-validated identity for the client AuthContext + login role check. The
// SERVER getUser() validates the access token from the cookie session against
// the Auth API — it does NOT depend on the browser's client-side refresh-token
// grant, which can fail after the API-key migration and leave the browser
// client returning null/hanging (the "Good morning, there." / stuck-login bug).
// This is the SAME check the route guards in app/portal|coach/layout.tsx pass.
//
// Response contract (callers rely on this):
//   200 { user: {...} }  — valid session; user.role is null only when the
//                          account GENUINELY has no role assigned.
//   200 { user: null }   — the server POSITIVELY confirmed there is no session.
//   503                  — transient failure (getUser/rpc errored); callers must
//                          treat this as "unknown", NOT as signed-out.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError && !user) {
    // Distinguish "no session" (AuthSessionMissingError — cookies absent, a
    // definitive no) from a transient validation failure (network/5xx — unknown).
    const noSession = userError.name === 'AuthSessionMissingError' || userError.status === 400;
    if (!noSession) return NextResponse.json({ error: 'auth-unavailable' }, { status: 503 });
    return NextResponse.json({ user: null });
  }
  if (!user) return NextResponse.json({ user: null });

  // Read the profile via the ADMIN (service-role) client, exactly like the
  // working /api/profile route — never a user-session RLS read (the path that
  // fails after the key migration). get_my_role is a security-definer RPC.
  const admin = await createAdminClient();
  const [roleRes, profileRes] = await Promise.all([
    supabase.rpc('get_my_role'),
    admin.from('profiles').select('full_name, avatar_url, nickname').eq('id', user.id).maybeSingle(),
  ]);

  // A transient rpc error must NOT read as "no role assigned" — the login page
  // signs users out over an authoritative null role. Surface it as unavailable.
  if (roleRes.error) return NextResponse.json({ error: 'role-unavailable' }, { status: 503 });
  const role = roleRes.data;
  const profile = profileRes.data;

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
