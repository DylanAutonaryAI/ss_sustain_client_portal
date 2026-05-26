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

  // Set the password via the admin API
  const { error: updErr } = await admin.auth.admin.updateUserById(userData.user.id, { password });
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
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
