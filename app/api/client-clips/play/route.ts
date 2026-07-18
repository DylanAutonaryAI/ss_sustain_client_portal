import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { streamConfigured, signPlaybackToken, iframeUrlForToken } from '@/lib/stream';

// Mints a short-lived signed player URL for ONE clip. Authorised only for the
// clip's owner (the client) or their coach — nobody else, even with the id.
// Used by both the client ("watch your own upload back") and the coach (review).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!streamConfigured()) {
    return NextResponse.json({ error: 'Clip playback is not switched on yet.' }, { status: 503 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { data: clip } = await admin.from('client_clips')
    .select('stream_uid, status, user_id, coach_id').eq('id', id).maybeSingle();
  if (!clip) return NextResponse.json({ error: 'Clip not found.' }, { status: 404 });

  // Owner or coach only.
  if (clip.user_id !== user.id && clip.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!clip.stream_uid || clip.status !== 'ready') {
    return NextResponse.json({ error: 'This clip is still processing.' }, { status: 409 });
  }

  try {
    const token = await signPlaybackToken(clip.stream_uid);
    return NextResponse.json({ iframeUrl: iframeUrlForToken(token) });
  } catch (e) {
    console.error('[client-clips] sign token failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Could not load the clip.' }, { status: 502 });
  }
}
