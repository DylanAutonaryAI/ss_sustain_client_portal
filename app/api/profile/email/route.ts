import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// Changes the user's login email. Done via the admin API with email_confirm so
// it takes effect immediately (the project has no custom SMTP, so the normal
// confirmation-email flow wouldn't deliver). Also syncs profile + roster rows.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await request.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const newEmail = email.trim().toLowerCase();

  // Throttle so the endpoint can't be used to probe which emails are registered.
  if (!(await rateLimit(`email-change:${user.id}`, 5, 60 * 60))) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });
  if (error) {
    // Generic message — never echo the raw error (it reveals whether the address
    // is already registered, an account-membership oracle).
    return NextResponse.json({ error: 'Could not update your email. Try a different address or contact your coach.' }, { status: 400 });
  }

  // Keep the profile + coach roster in sync with the new email.
  await admin.from('profiles').update({ email: newEmail }).eq('id', user.id);
  await admin.from('clients').update({ email: newEmail }).eq('user_id', user.id);

  return NextResponse.json({ ok: true, email: newEmail });
}
