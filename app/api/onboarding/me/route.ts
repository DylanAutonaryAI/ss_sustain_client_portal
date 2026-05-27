import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ONBOARDING_STEP_KEYS } from '@/lib/onboarding';

// The signed-in CLIENT's own onboarding progress. Scoped to user_id, so a
// client only ever sees/writes their own record. All access goes through the
// service-role admin client (RLS is on with no public policies), exactly like
// /api/clients/me.

// GET → { completed: string[], completedAt: string | null, isClient: boolean }
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id, onboarding_completed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  // No client row (e.g. a coach) → onboarding doesn't apply.
  if (!client) {
    return NextResponse.json({ completed: [], completedAt: null, isClient: false });
  }

  const { data: rows } = await admin
    .from('onboarding_progress')
    .select('step_key')
    .eq('client_id', client.id);

  return NextResponse.json({
    completed: (rows ?? []).map((r) => r.step_key),
    completedAt: client.onboarding_completed_at,
    isClient: true,
  });
}

// POST { step_key } → marks one step done, and stamps onboarding_completed_at
// once every step is finished. Returns the fresh { completed, completedAt }.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { step_key } = await request.json().catch(() => ({}));
  if (!step_key || !ONBOARDING_STEP_KEYS.includes(step_key)) {
    return NextResponse.json({ error: 'Unknown step.' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, email, onboarding_completed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: 'No client record for this account.' }, { status: 404 });
  }

  // Record the step (idempotent — re-posting the same step is a no-op).
  const { error: upsertErr } = await admin
    .from('onboarding_progress')
    .upsert({ client_id: client.id, step_key }, { onConflict: 'client_id,step_key' });
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  // Re-read all completed steps and decide whether onboarding is now finished.
  const { data: rows } = await admin
    .from('onboarding_progress')
    .select('step_key')
    .eq('client_id', client.id);
  const completed = (rows ?? []).map((r) => r.step_key);
  const allDone = ONBOARDING_STEP_KEYS.every((k) => completed.includes(k));

  let completedAt = client.onboarding_completed_at as string | null;
  if (allDone && !completedAt) {
    completedAt = new Date().toISOString();
    await admin.from('clients').update({ onboarding_completed_at: completedAt }).eq('id', client.id);
    // 🔔 Onboarding just completed. Sam's in-portal proof (roster badge) updates
    // from onboarding_completed_at automatically. Hook the email notification in
    // here once RESEND_API_KEY + Sam's address are set:
    //   await notifyCoachOnboardingComplete({ name: client.full_name, email: client.email });
  }

  return NextResponse.json({ completed, completedAt });
}
