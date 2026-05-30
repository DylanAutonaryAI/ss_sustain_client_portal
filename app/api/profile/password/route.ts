import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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

    const { password } = await request.json();
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
