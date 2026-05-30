import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Grants portal access to a pending client. The coach uses this once Sam's
// out-of-portal Brevo onboarding (Calendly call, welcome pack signed-and-dated)
// is complete. Effect: sends the Supabase invite email, links the new auth
// user to the clients row, and stamps access_granted_at = now() so the row
// stops showing as pending in the roster.
//
// Body: { id: <clients.id> }. Idempotent — calling it on a client that already
// has access returns ok without sending another invite (so a double-click can't
// double-email the client).

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();

  const { data: row, error: fetchError } = await admin
    .from('clients')
    .select('id, email, full_name, user_id, access_granted_at, coach_id')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single();
  if (fetchError || !row) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!row.email) return NextResponse.json({ error: 'Client has no email on file' }, { status: 400 });

  // Idempotent: already granted? do nothing.
  if (row.access_granted_at) return NextResponse.json({ client: row, alreadyGranted: true });

  // Match the trailing-slash fix from /api/invite-client — Supabase's redirect
  // allow-list rejects `…com//auth/callback` and silently falls back to the
  // Site URL, which dumps the invited client on /login.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  let userId: string | null = row.user_id;

  if (!userId) {
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      row.email,
      { data: { full_name: row.full_name ?? '' }, redirectTo: `${siteUrl}/auth/callback` },
    );
    if (inviteError) {
      // If the user already exists in auth (e.g. they were a previous client),
      // we still want to mark access granted — just look them up by email and
      // link the existing user_id.
      if (inviteError.message.includes('already been registered')) {
        const { data: list } = await admin.auth.admin.listUsers();
        userId = list?.users.find((u) => u.email?.toLowerCase() === row.email!.toLowerCase())?.id ?? null;
      } else {
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }
    } else {
      userId = inviteData?.user?.id ?? null;
    }
  }

  const { data: updated, error: updateError } = await admin
    .from('clients')
    .update({
      user_id: userId,
      access_granted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('coach_id', user.id)
    .select()
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ client: updated });
}
