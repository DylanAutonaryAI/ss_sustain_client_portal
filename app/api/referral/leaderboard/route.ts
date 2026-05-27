import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Coach-only: ranks the coach's clients by how many referral leads they've
// generated. Counts come from the referral_leads table (real data).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();

  const { data: clientRows } = await admin
    .from('clients')
    .select('id, full_name, since, status, user_id')
    .eq('coach_id', user.id);
  const clients = clientRows ?? [];
  const ids = clients.map(c => c.id);

  // Rank by CONVERSIONS (people who actually joined — the £100-earning metric),
  // and keep total leads as a secondary signal.
  const counts: Record<string, number> = {};      // converted referrals
  const leadCounts: Record<string, number> = {};   // all leads (enquiries)
  if (ids.length) {
    const { data: leads } = await admin
      .from('referral_leads')
      .select('referrer_id, status')
      .in('referrer_id', ids);
    for (const l of leads ?? []) {
      if (!l.referrer_id) continue;
      leadCounts[l.referrer_id] = (leadCounts[l.referrer_id] ?? 0) + 1;
      if (l.status === 'converted') counts[l.referrer_id] = (counts[l.referrer_id] ?? 0) + 1;
    }
  }

  // Profile avatar/nickname for display
  const userIds = clients.map(c => c.user_id).filter((x): x is string => !!x);
  const profiles: Record<string, { avatar_url?: string; nickname?: string }> = {};
  if (userIds.length) {
    const { data: profs } = await admin.from('profiles').select('*').in('id', userIds);
    for (const p of profs ?? []) profiles[p.id] = { avatar_url: p.avatar_url, nickname: p.nickname };
  }

  const ranked = clients
    .map(c => ({
      id: c.id,
      name: c.full_name || 'Unnamed',
      since: c.since || '',
      status: c.status as string,
      referrals: counts[c.id] ?? 0,      // converted (joined) — the £100-earning ones
      leads: leadCounts[c.id] ?? 0,       // all enquiries via their link
      avatarUrl: c.user_id ? profiles[c.user_id]?.avatar_url ?? null : null,
      nickname: c.user_id ? profiles[c.user_id]?.nickname ?? null : null,
    }))
    .sort((a, b) => b.referrals - a.referrals || b.leads - a.leads || a.name.localeCompare(b.name));

  const totalReferrals = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0);
  const referrers = Object.values(counts).filter(n => n > 0).length;

  return NextResponse.json({ ranked, totalReferrals, totalLeads, referrers });
}
