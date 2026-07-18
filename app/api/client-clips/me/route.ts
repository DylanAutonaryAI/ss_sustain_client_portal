import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { streamConfigured, createDirectUpload, deleteVideo } from '@/lib/stream';
import {
  RETENTION_DAYS, MAX_DURATION_SECONDS, ALLOWED_MUSCLES,
  retentionCutoffISO, refreshPending, mapClip, type ClipRow,
} from '@/lib/client-clips';

// The signed-in CLIENT's own form-check clips.
//   GET    → list own clips (newest first, within retention), refreshing any
//            still-processing ones from Cloudflare.
//   POST   → start an upload: mint a one-time Cloudflare direct-upload URL and
//            record an 'uploading' row. The browser uploads straight to that URL.
//   PATCH  → the browser finished pushing the file → mark the row 'processing'.
//   DELETE → remove own clip (and its Cloudflare video).
// All scoped to user.id via the service-role admin client (RLS is locked), same
// pattern as /api/tracker/me.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT = 'id, stream_uid, status, label, muscle, duration_seconds, thumbnail_url, bytes, created_at, reviewed_at';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data: rows } = await admin.from('client_clips').select(SELECT)
    .eq('user_id', user.id)
    .gte('created_at', retentionCutoffISO())
    .order('created_at', { ascending: false });

  const refreshed = await refreshPending(admin, (rows ?? []) as ClipRow[]);
  return NextResponse.json({ clips: refreshed.map(mapClip), configured: streamConfigured() });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!streamConfigured()) {
    return NextResponse.json({ error: 'Clip uploads are not switched on yet.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 120) : null;
  const muscle = typeof body.muscle === 'string' && ALLOWED_MUSCLES.includes(body.muscle) ? body.muscle : null;

  const admin = await createAdminClient();
  const { data: clientRow } = await admin.from('clients').select('id, coach_id').eq('user_id', user.id).maybeSingle();
  if (!clientRow?.coach_id) {
    return NextResponse.json({ error: 'No client record for this account.' }, { status: 400 });
  }

  // Abuse guard: cap uploads per client per day (expected ~6/week). Fail-open.
  if (!(await rateLimit(`clip-upload:${user.id}`, 40, 24 * 60 * 60))) {
    return NextResponse.json({ error: 'Daily upload limit reached — please try again tomorrow.' }, { status: 429 });
  }

  let uploadURL: string, uid: string;
  try {
    ({ uploadURL, uid } = await createDirectUpload({
      maxDurationSeconds: MAX_DURATION_SECONDS,
      creator: clientRow.id,
      retentionDays: RETENTION_DAYS,
      meta: { clientId: clientRow.id, userId: user.id, ...(label ? { label } : {}) },
    }));
  } catch (e) {
    console.error('[client-clips] direct_upload failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Could not start the upload. Please try again.' }, { status: 502 });
  }

  const { data: inserted, error } = await admin.from('client_clips').insert({
    client_id: clientRow.id,
    user_id: user.id,
    coach_id: clientRow.coach_id,
    stream_uid: uid,
    status: 'uploading',
    label,
    muscle,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: inserted.id, uploadURL });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  // Only advance our own still-'uploading' row; a failed upload never flips it.
  await admin.from('client_clips').update({ status: 'processing' })
    .eq('id', id).eq('user_id', user.id).eq('status', 'uploading');
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { data: row } = await admin.from('client_clips').select('stream_uid').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  await admin.from('client_clips').delete().eq('id', id).eq('user_id', user.id);
  if (row.stream_uid && streamConfigured()) {
    try { await deleteVideo(row.stream_uid); }
    catch (e) { console.error('[client-clips] CF delete failed:', e instanceof Error ? e.message : e); }
  }
  return NextResponse.json({ ok: true });
}
