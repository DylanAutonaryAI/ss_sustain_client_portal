import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// The service-role key must never touch the edge runtime; never cache.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Changes the signed-in user's password via the admin API. The browser
// supabase.auth.updateUser() call hangs after the API-key migration (same
// root cause documented in AuthContext for getUser/getSession), so the
// Settings page posts here instead.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password, currentPassword } = await request.json();
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ error: 'Enter your current password to confirm the change.' }, { status: 400 });
    }

    // Throttle current-password guesses so a hijacked session can't brute-force
    // the current password to complete the takeover it's trying to defend against.
    if (!(await rateLimit(`pw-change:${user.id}`, 5, 15 * 60))) {
      return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
    }

    // Re-auth: verify the CURRENT password before changing it, so a stolen or
    // shared session can't silently take over the account. Uses a throwaway,
    // non-persistent client so the caller's session/cookies are untouched.
    const verifier = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: reauthErr } = await verifier.auth.signInWithPassword({
      email: user.email ?? '',
      password: currentPassword,
    });
    if (reauthErr) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 403 });
    }

    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
