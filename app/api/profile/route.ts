import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Returns the signed-in user's profile (login email + profile fields).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? '',
      nickname: profile?.nickname ?? '',
      birthday: profile?.birthday ?? '',
      avatar_url: profile?.avatar_url ?? '',
      role: profile?.role ?? 'client',
    },
  });
}

// Updates display name / nickname / birthday on the profile. Scoped to the
// authenticated user — a client can only ever edit their own row.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === 'string') updates.full_name = body.full_name.trim();
  if (typeof body.nickname === 'string') updates.nickname = body.nickname.trim() || null;
  if ('birthday' in body) updates.birthday = body.birthday || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the coach roster's name in sync if the display name changed.
  if (typeof updates.full_name === 'string' && updates.full_name) {
    await admin.from('clients').update({ full_name: updates.full_name }).eq('user_id', user.id);
  }

  return NextResponse.json({ profile: data });
}
