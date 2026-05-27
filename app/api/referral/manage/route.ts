import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { computePayoutDue, payoutState, REFERRAL_REWARD_GBP, type PlanType } from '@/lib/referral';

// Coach-only referral management: list every lead from the coach's clients with
// its conversion + £100 payout state, convert a lead (picking the plan, which
// sets when the £100 is due), and mark a payout paid. No money moves here — Sam
// pays by transfer and ticks it off; this is the source of truth + reminder.

type AdminDb = Awaited<ReturnType<typeof createAdminClient>>;

async function coachClientIds(adminDb: AdminDb, coachId: string) {
  const { data } = await adminDb.from('clients').select('id, full_name').eq('coach_id', coachId);
  return data ?? [];
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await createAdminClient();
  const clients = await coachClientIds(admin, user.id);
  const ids = clients.map(c => c.id);
  if (!ids.length) return NextResponse.json({ leads: [], reward: REFERRAL_REWARD_GBP });

  const nameById: Record<string, string> = {};
  for (const c of clients) nameById[c.id] = c.full_name || 'Unnamed';

  const { data: leads } = await admin
    .from('referral_leads')
    .select('*')
    .in('referrer_id', ids)
    .order('created_at', { ascending: false });

  const mapped = (leads ?? []).map(l => ({
    id: l.id,
    referrerId: l.referrer_id,
    referrerName: nameById[l.referrer_id] ?? 'Unknown',
    name: l.name,
    email: l.email,
    status: l.status,
    createdAt: l.created_at,
    planType: l.plan_type as PlanType | null,
    joinedAt: l.joined_at,
    payoutDueAt: l.payout_due_at,
    payoutPaidAt: l.payout_paid_at,
    payout: payoutState(l),
  }));

  return NextResponse.json({ leads: mapped, reward: REFERRAL_REWARD_GBP });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { action, lead_id } = body as { action?: string; lead_id?: number };
  if (!action || !lead_id) return NextResponse.json({ error: 'action and lead_id are required' }, { status: 400 });

  const admin = await createAdminClient();
  const clients = await coachClientIds(admin, user.id);
  const ids = new Set(clients.map(c => c.id));

  // Confirm the lead belongs to one of this coach's clients before touching it.
  const { data: lead } = await admin.from('referral_leads').select('*').eq('id', lead_id).maybeSingle();
  if (!lead || !ids.has(lead.referrer_id)) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (action === 'convert') {
    const planType = body.plan_type as PlanType;
    if (planType !== 'upfront' && planType !== 'monthly') {
      return NextResponse.json({ error: 'plan_type must be upfront or monthly' }, { status: 400 });
    }
    const joinedAt: string = body.joined_at || new Date().toISOString().slice(0, 10);
    const payoutDue = computePayoutDue(planType, joinedAt);
    // Best-effort link to the new client's roster row if their email matches one.
    const { data: match } = await admin
      .from('clients')
      .select('id')
      .eq('coach_id', user.id)
      .ilike('email', lead.email)
      .maybeSingle();

    const { error } = await admin.from('referral_leads').update({
      status: 'converted',
      plan_type: planType,
      joined_at: joinedAt,
      payout_due_at: payoutDue,
      converted_client_id: match?.id ?? null,
    }).eq('id', lead_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'unconvert') {
    // Revert a mistaken conversion back to a plain lead.
    const { error } = await admin.from('referral_leads').update({
      status: 'pending', plan_type: null, joined_at: null, payout_due_at: null,
      payout_paid_at: null, converted_client_id: null,
    }).eq('id', lead_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'pay' || action === 'unpay') {
    const { error } = await admin.from('referral_leads')
      .update({ payout_paid_at: action === 'pay' ? new Date().toISOString() : null })
      .eq('id', lead_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    // Removes the lead entirely. The leaderboard, the referrer's earned/pending,
    // and the coach totals all recompute from referral_leads, so this resets them.
    const { error } = await admin.from('referral_leads').delete().eq('id', lead_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
