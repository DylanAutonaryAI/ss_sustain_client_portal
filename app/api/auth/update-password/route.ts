import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Sets a new password for the user in the current (recovery) session — used by
// the reset flow after /api/auth/exchange has established the session cookies.
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Your reset session has expired. Request a new link.' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: role } = await supabase.rpc('get_my_role');
  return NextResponse.json({ ok: true, role });
}
