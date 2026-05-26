import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';

// Client-only: returns the signed-in client's own referral code + their leads.
// Lazily generates a code if the client doesn't have one yet.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();

  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, referral_code')
    .eq('user_id', user.id)
    .single();

  if (!client) {
    // Not linked to a client record (e.g. a coach viewing) — nothing to show.
    return NextResponse.json({ code: null, leads: [] });
  }

  let code = client.referral_code as string | null;
  if (!code) {
    code = generateReferralCode(client.full_name || user.email?.split('@')[0] || 'SS');
    await admin.from('clients').update({ referral_code: code }).eq('id', client.id);
  }

  const { data: leads } = await admin
    .from('referral_leads')
    .select('name, email, status, created_at')
    .eq('referrer_id', client.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ code, leads: leads ?? [] });
}
