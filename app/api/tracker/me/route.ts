import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { weekStartISO } from '@/lib/tracker';

// The signed-in CLIENT's own tracker. GET → { profile, weekLogs }. POST saves the
// setup. PUT adds an off-plan meal / night-out log. All scoped to user.id via the
// service-role admin client (RLS is locked), like /api/onboarding/me.

type AdminDb = Awaited<ReturnType<typeof createAdminClient>>;
const mapLog = (r: { id: number; label: string; cal: number; notes: string | null; is_night_out: boolean; logged_on: string }) =>
  ({ id: r.id, label: r.label, cal: r.cal, notes: r.notes, isNightOut: r.is_night_out, loggedOn: r.logged_on });

async function coachIdFor(admin: AdminDb, userId: string): Promise<string | null> {
  const { data } = await admin.from('clients').select('coach_id').eq('user_id', userId).maybeSingle();
  return data?.coach_id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const [{ data: profile }, { data: logs }] = await Promise.all([
    admin.from('tracker_profiles').select('calories, goal, steps, sessions').eq('user_id', user.id).maybeSingle(),
    admin.from('tracker_logs')
      .select('id, label, cal, notes, is_night_out, logged_on')
      .eq('user_id', user.id)
      .gte('logged_on', weekStartISO())
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({ profile: profile ?? null, weekLogs: (logs ?? []).map(mapLog) });
}

// Save / update the one-time setup.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const calories = Number(body.calories);
  if (!calories || calories < 1000 || calories > 5000) {
    return NextResponse.json({ error: 'Daily calorie target must be between 1000 and 5000.' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const coachId = await coachIdFor(admin, user.id);
  if (!coachId) return NextResponse.json({ error: 'No client record for this account.' }, { status: 400 });

  const { error } = await admin.from('tracker_profiles').upsert({
    user_id: user.id,
    coach_id: coachId,
    calories,
    goal: body.goal === 'Maintenance' ? 'Maintenance' : 'Fat loss',
    steps: body.steps ?? null,
    sessions: body.sessions ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Log an off-plan meal / night out.
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const cal = Number(body.cal);
  if (!body.label || !cal || cal <= 0) {
    return NextResponse.json({ error: 'A label and calorie amount are required.' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const coachId = await coachIdFor(admin, user.id);
  if (!coachId) return NextResponse.json({ error: 'No client record for this account.' }, { status: 400 });

  const { error } = await admin.from('tracker_logs').insert({
    user_id: user.id,
    coach_id: coachId,
    label: String(body.label).slice(0, 200),
    cal: Math.round(cal),
    notes: body.notes ? String(body.notes).slice(0, 300) : null,
    is_night_out: !!body.isNightOut,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Remove a log the client mis-entered (scoped to their own rows).
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin.from('tracker_logs').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
