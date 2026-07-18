import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { streamConfigured, deleteVideo } from '@/lib/stream';
import { retentionCutoffISO, refreshPending, mapClip, type ClipRow } from '@/lib/client-clips';

// Coach-only review side of the client-clips feature.
//   GET (no clientId) → every one of the coach's clients with their clip counts
//                       (total + unreviewed + latest), unreviewed first.
//   GET ?clientId=…   → that one client's clips (verified to belong to the coach),
//                       refreshing any still-processing ones from Cloudflare.
//   PATCH             → mark a clip reviewed / un-reviewed (drives the badge).
//   DELETE ?id=…      → remove a clip (and its Cloudflare video).
// Every query is scoped to coach_id via the service-role admin client (RLS is
// locked), same pattern as /api/tracker/client.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT = 'id, stream_uid, status, label, muscle, duration_seconds, thumbnail_url, bytes, created_at, reviewed_at, client_id';

type CoachOk = { user: { id: string }; error?: undefined };
type CoachErr = { user?: undefined; error: NextResponse };

async function requireCoach(): Promise<CoachOk | CoachErr> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user: { id: user.id } };
}

export async function GET(request: NextRequest) {
  const auth = await requireCoach();
  if (auth.error) return auth.error;
  const coachId = auth.user.id;

  const admin = await createAdminClient();
  const clientId = new URL(request.url).searchParams.get('clientId');
  const cutoff = retentionCutoffISO();

  if (clientId) {
    // Confirm the client belongs to this coach before returning anything.
    const { data: client } = await admin.from('clients').select('id, full_name')
      .eq('id', clientId).eq('coach_id', coachId).maybeSingle();
    if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

    const { data: rows } = await admin.from('client_clips').select(SELECT)
      .eq('coach_id', coachId).eq('client_id', clientId)
      .gte('created_at', cutoff).order('created_at', { ascending: false });

    const refreshed = await refreshPending(admin, (rows ?? []) as ClipRow[]);
    return NextResponse.json({
      client: { id: client.id, name: client.full_name },
      clips: refreshed.map(mapClip),
      configured: streamConfigured(),
    });
  }

  // Summary across all the coach's clients (show everyone, even with 0 clips).
  const [{ data: clients }, { data: clips }] = await Promise.all([
    admin.from('clients').select('id, full_name').eq('coach_id', coachId),
    admin.from('client_clips').select('client_id, reviewed_at, created_at')
      .eq('coach_id', coachId).gte('created_at', cutoff),
  ]);

  const byClient = new Map<string, { total: number; unreviewed: number; latestAt: string | null }>();
  for (const c of clips ?? []) {
    const e = byClient.get(c.client_id) ?? { total: 0, unreviewed: 0, latestAt: null };
    e.total += 1;
    if (!c.reviewed_at) e.unreviewed += 1;
    if (!e.latestAt || c.created_at > e.latestAt) e.latestAt = c.created_at;
    byClient.set(c.client_id, e);
  }

  const summary = (clients ?? []).map((c) => {
    const e = byClient.get(c.id) ?? { total: 0, unreviewed: 0, latestAt: null };
    return { clientId: c.id, name: c.full_name, total: e.total, unreviewed: e.unreviewed, latestAt: e.latestAt };
  }).sort((a, b) => (b.unreviewed - a.unreviewed) || (b.latestAt ?? '').localeCompare(a.latestAt ?? ''));

  return NextResponse.json({ clients: summary, configured: streamConfigured() });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCoach();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin.from('client_clips')
    .update({ reviewed_at: body.reviewed === false ? null : new Date().toISOString() })
    .eq('id', body.id).eq('coach_id', auth.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCoach();
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { data: row } = await admin.from('client_clips').select('stream_uid').eq('id', id).eq('coach_id', auth.user.id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  await admin.from('client_clips').delete().eq('id', id).eq('coach_id', auth.user.id);
  if (row.stream_uid && streamConfigured()) {
    try { await deleteVideo(row.stream_uid); }
    catch (e) { console.error('[client-clips] CF delete failed:', e instanceof Error ? e.message : e); }
  }
  return NextResponse.json({ ok: true });
}
