import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';

// Adds a client to the coach's roster, optionally sending the portal invite.
// Two modes:
//   • Default (pending !== true) → send the Supabase invite email immediately,
//     stamp clients.access_granted_at = now(). Same as the original flow.
//   • pending = true → DO NOT touch auth.users and DO NOT send any email; just
//     create a pending clients row (user_id null, access_granted_at null).
//     Used by the Stripe purchase flow (so paid customers land in the roster
//     waiting on Sam's Brevo onboarding before getting portal access) and by
//     the coach's "Add as pending" toggle. Once Sam finishes onboarding he
//     hits "Grant access & send invite" in the roster → /api/clients/grant-access.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, full_name, goal, status, next_payment_date, notes, since, pending } = body;

  if (!email || !full_name) {
    return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 });
  }

  const adminClient = await createAdminClient();
  let invitedUserId: string | null = null;

  if (!pending) {
    // Strip any trailing slash so the redirect is always exactly `<origin>/auth/callback`
    // (a trailing slash here → `…com//auth/callback`, which fails Supabase's redirect
    // allow-list match and silently falls back to the Site URL → user lands on /login).
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { data: { full_name }, redirectTo: `${siteUrl}/auth/callback` }
    );

    if (inviteError) {
      // If user already exists, that's OK — just create the client record.
      if (!inviteError.message.includes('already been registered')) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }
    }
    invitedUserId = inviteData?.user?.id ?? null;
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      user_id: invitedUserId,
      coach_id: user.id,
      full_name,
      email,
      goal: goal ?? null,
      status: status ?? 'Active',
      next_payment_date: next_payment_date ?? null,
      notes: notes ?? null,
      since: since ?? new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      referral_code: generateReferralCode(full_name),
      access_granted_at: pending ? null : new Date().toISOString(),
    })
    .select()
    .single();

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  return NextResponse.json({ client });
}
