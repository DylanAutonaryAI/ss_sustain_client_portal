import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify caller is a coach
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, full_name, goal, status, next_payment_date, notes, since } = body;

  if (!email || !full_name) {
    return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Send Supabase invite email — redirectTo sends them to our auth callback after password set
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name }, redirectTo: `${siteUrl}/auth/callback` }
  );

  if (inviteError) {
    // If user already exists, that's OK — just create the client record
    if (!inviteError.message.includes('already been registered')) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  // Insert the client record into the clients table
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      user_id: inviteData?.user?.id ?? null,
      coach_id: user.id,
      full_name,
      email,
      goal: goal ?? null,
      status: status ?? 'Active',
      next_payment_date: next_payment_date ?? null,
      notes: notes ?? null,
      since: since ?? new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      referral_code: generateReferralCode(full_name),
    })
    .select()
    .single();

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  return NextResponse.json({ client });
}
