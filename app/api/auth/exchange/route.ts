import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Exchanges a password-reset / magic-link credential for a session, server-side.
// The browser stored the PKCE code-verifier in a cookie when the reset was
// requested, so the server client can complete the exchange and set the session
// cookies — no browser-side auth locks involved.
export async function POST(request: NextRequest) {
  const { code, token_hash, type } = await request.json();
  const supabase = await createClient();

  let error = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (token_hash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType }));
  } else {
    return NextResponse.json({ error: 'Missing code or token_hash.' }, { status: 400 });
  }

  if (error) {
    // A concurrent request (e.g. dev StrictMode) may have already consumed the
    // one-time code — treat it as success if a session now exists.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
