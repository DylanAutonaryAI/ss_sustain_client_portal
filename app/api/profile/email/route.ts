import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the profile + coach roster in sync with the new email.
  await admin.from('profiles').update({ email: newEmail }).eq('id', user.id);
  await admin.from('clients').update({ email: newEmail }).eq('user_id', user.id);

  return NextResponse.json({ ok: true, email: newEmail });
}
