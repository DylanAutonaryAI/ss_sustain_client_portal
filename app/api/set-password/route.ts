import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { access_token, refresh_token, password } = await request.json();

  if (!access_token || !refresh_token || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Validate the invite access token and resolve the user (no session/lock needed)
  const { data: userData, error: userErr } = await admin.auth.getUser(access_token);
  if (userErr || !userData?.user) {
    return NextResponse.json(
      { error: 'This invite link has expired. Ask your coach to resend it.' },
      { status: 401 },
    );
  }
  const uid = userData.user.id;

  // Single-use enforcement. The invite access_token stays valid for ~1h; without
  // this, the same link could be replayed within that window to re-run the
  // password-set path. We stamp the client's row on first acceptance and refuse
  // a second run. Keyed on the clients row (the only rows the invite flow
  // creates). Fail-open on a lookup error so a DB blip can never block a
  // legitimate first-time client from setting their password. Uses .limit(1)
  // (not maybeSingle) so a stray duplicate row can't throw here either.
  let clientRowId: string | null = null;
  try {
    const { data: crows } = await admin
      .from('clients')
      .select('id, invite_accepted_at')
      .eq('user_id', uid)
      .limit(1);
    const crow = crows?.[0];
    if (crow) {
      clientRowId = crow.id;
      if (crow.invite_accepted_at) {
        return NextResponse.json(
          { error: 'This invite has already been used. Please sign in with your email and password.' },
          { status: 409 },
        );
      }
    }
  } catch {}

  // Set the password via the admin API
  const { error: updErr } = await admin.auth.admin.updateUserById(uid, { password });
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Mark the invite consumed so it can't be replayed. Best-effort — the password
  // is already set at this point, so a failure here must not fail the request.
  if (clientRowId) {
    try {
      await admin.from('clients').update({ invite_accepted_at: new Date().toISOString() }).eq('id', clientRowId);
    } catch {}
  }

  // Establish a logged-in session by writing the session cookies on the response
  const supabase = await createClient();
  const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessErr) {
    // Password was set successfully; fall back to manual login
    return NextResponse.json({ success: true, needsLogin: true });
  }

  return NextResponse.json({ success: true });
}
