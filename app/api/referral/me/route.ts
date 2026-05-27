import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateReferralCode, payoutState, REFERRAL_REWARD_GBP } from '@/lib/referral';

// First name + last initial, for the client-facing team leaderboard (we never
// show full surnames or the £ amounts to other clients).
function shortName(full: string | null): string {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Client';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Client-only: returns the signed-in client's own referral code + their leads,
// plus the team leaderboard (counts only) so they can see how they rank.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();

  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, referral_code, coach_id')
    .eq('user_id', user.id)
    .single();

  if (!client) {
    // Not linked to a client record (e.g. a coach viewing) — nothing to show.
    return NextResponse.json({ code: null, leads: [] });
  }

  let code = client.referral_code as string | null;
  if (!code) {
    const newCode = generateReferralCode(client.full_name || user.email?.split('@')[0] || 'SS');
    // Idempotent under concurrent calls (React StrictMode fires this effect twice):
    // only the first writer sets the code (guarded by `is('referral_code', null)`),
    // then everyone re-reads the single stored value — so the link the client sees
    // always matches what /join validates against. (A prior race could persist one
    // code while showing another, which read as "referral link no longer valid".)
    await admin.from('clients').update({ referral_code: newCode }).eq('id', client.id).is('referral_code', null);
    const { data: fresh } = await admin.from('clients').select('referral_code').eq('id', client.id).single();
    code = fresh?.referral_code ?? newCode;
  }

  const { data: rows } = await admin
    .from('referral_leads')
    .select('name, email, status, created_at, plan_type, joined_at, payout_due_at, payout_paid_at')
    .eq('referrer_id', client.id)
    .order('created_at', { ascending: false });

  const leads = (rows ?? []).map(l => ({
    name: l.name,
    email: l.email,
    status: l.status,
    created_at: l.created_at,
    planType: l.plan_type,
    payoutDueAt: l.payout_due_at,
    payout: payoutState(l), // 'none' | 'pending' | 'due' | 'paid'
  }));

  // £100 per converted referral: 'earned' = already paid out; 'pending' = owed
  // (held or due now). Drives the referrer's "your rewards" panel.
  const earned  = leads.filter(l => l.payout === 'paid').length * REFERRAL_REWARD_GBP;
  const pending = leads.filter(l => l.payout === 'pending' || l.payout === 'due').length * REFERRAL_REWARD_GBP;
  const converted = leads.filter(l => l.status === 'converted').length;

  // ── Team leaderboard (counts only — first name + last initial, no £) ─────────
  let standings: { name: string; referrals: number; isMe: boolean; rank: number }[] = [];
  let myRank: number | null = null;
  if (client.coach_id) {
    const { data: team } = await admin.from('clients').select('id, full_name').eq('coach_id', client.coach_id);
    const ids = (team ?? []).map(t => t.id);
    const conv: Record<string, number> = {};
    if (ids.length) {
      const { data: cr } = await admin.from('referral_leads').select('referrer_id').eq('status', 'converted').in('referrer_id', ids);
      for (const r of cr ?? []) if (r.referrer_id) conv[r.referrer_id] = (conv[r.referrer_id] ?? 0) + 1;
    }
    const ranked = (team ?? [])
      .map(t => ({ name: shortName(t.full_name), referrals: conv[t.id] ?? 0, isMe: t.id === client.id }))
      .filter(x => x.referrals > 0)
      .sort((a, b) => b.referrals - a.referrals || a.name.localeCompare(b.name))
      .map((x, i) => ({ ...x, rank: i + 1 }));
    myRank = ranked.find(x => x.isMe)?.rank ?? null;
    standings = ranked.slice(0, 10);
    // Guarantee the viewer sees their own row even if they're below the top 10.
    if (myRank && myRank > 10) {
      const mine = ranked.find(x => x.isMe);
      if (mine) standings.push(mine);
    }
  }

  return NextResponse.json({ code, leads, reward: REFERRAL_REWARD_GBP, earned, pending, converted, standings, myRank });
}
