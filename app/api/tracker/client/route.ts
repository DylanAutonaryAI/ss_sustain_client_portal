import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { weekStartISO } from '@/lib/tracker';

// Coach-only: read ONE of the coach's clients' tracker (setup + this-week logs +
// recent history) for the roster view. Takes the clients-row id; verifies it
// belongs to the calling coach, then reads by that client's user_id.
const mapLog = (r: { id: number; label: string; cal: number; notes: string | null; is_night_out: boolean; logged_on: string }) =>
  ({ id: r.id, label: r.label, cal: r.cal, notes: r.notes, isNightOut: r.is_night_out, loggedOn: r.logged_on });

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clientId = new URL(request.url).searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });

  const admin = await createAdminClient();
  // Confirm the client belongs to this coach and resolve their auth user_id.
  const { data: client } = await admin
    .from('clients')
    .select('user_id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .maybeSingle();

  // No row / not linked to a login yet → empty tracker (client hasn't set it up).
  if (!client?.user_id) {
    return NextResponse.json({ profile: null, weekLogs: [], recentLogs: [] });
  }
  const uid = client.user_id;

  const [{ data: profile }, { data: weekRows }, { data: recentRows }] = await Promise.all([
    admin.from('tracker_profiles').select('calories, goal, steps, sessions, updated_at').eq('user_id', uid).maybeSingle(),
    admin.from('tracker_logs').select('id, label, cal, notes, is_night_out, logged_on')
      .eq('user_id', uid).gte('logged_on', weekStartISO()).order('created_at', { ascending: false }),
    admin.from('tracker_logs').select('id, label, cal, notes, is_night_out, logged_on')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    profile: profile ?? null,
    weekLogs: (weekRows ?? []).map(mapLog),
    recentLogs: (recentRows ?? []).map(mapLog),
  });
}
