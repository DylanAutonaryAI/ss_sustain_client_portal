import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// Changes the user's login email — WITH ownership verification.
//
// Previously this did an instant admin change (email_confirm: true), which
// switched the login email without the user ever proving they control the new
// inbox (a typo could lock them out; it could be pointed at someone else's
// address). Now it goes through Supabase's own confirmation flow: updateUser
// emails a confirmation link to the NEW address (via the project's verified
// Resend SMTP) and the change only lands when that link is clicked. profiles /
// clients rows are reconciled to the new email once auth confirms it — see the
// self-healing sync in /api/me.
//
// Degrades safely: if the Supabase project has email confirmations disabled,
// updateUser applies immediately and we sync profiles/clients here directly, so
// there's no regression versus the old behaviour in that configuration.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await request.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const newEmail = email.trim().toLowerCase();

  // No-op if unchanged — don't send a pointless confirmation email.
  if (newEmail === (user.email ?? '').toLowerCase()) {
    return NextResponse.json({ ok: true, email: newEmail, unchanged: true });
  }

  // Throttle so the endpoint can't be used to probe which emails are registered,
  // or to spam a victim's inbox with confirmation emails.
  if (!(await rateLimit(`email-change:${user.id}`, 5, 60 * 60))) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  // Server-side updateUser (NOT the browser client — that hangs post-key-migration,
  // same class as getUser/getSession). Sends the confirmation to the new address.
  const { data, error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${siteUrl}/portal/settings` },
  );
  if (error) {
    // Generic message — never echo the raw error (it reveals whether the address
    // is already registered, an account-membership oracle).
    return NextResponse.json({ error: 'Could not update your email. Try a different address or contact your coach.' }, { status: 400 });
  }

  // Confirmations disabled at the project level → the change already applied.
  // Keep the profile + coach roster in sync immediately in that case.
  const applied = (data.user?.email ?? '').toLowerCase() === newEmail;
  if (applied) {
    const admin = await createAdminClient();
    await admin.from('profiles').update({ email: newEmail }).eq('id', user.id);
    await admin.from('clients').update({ email: newEmail }).eq('user_id', user.id);
    return NextResponse.json({ ok: true, email: newEmail, pending: false });
  }

  // Confirmation pending — the login email does NOT change until the user clicks
  // the link in their new inbox. profiles/clients stay on the old email until then.
  return NextResponse.json({ ok: true, pending: true });
}
