import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Per-user sidebar notification "seen" state. Replaces the old per-browser
// localStorage so badges survive logout / refresh / a different machine and
// only re-light when a genuinely new id appears.
//
// GET  → { seen: { [section_key]: string[] } } for the calling user.
// POST { key, ids: string[] } → upsert the seen set for one section.
//
// RLS on notification_seen is locked; this route runs via the service-role
// admin client and scopes every query to the cookie-validated user.id.

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('notification_seen')
    .select('section_key, seen_ids')
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen: Record<string, string[]> = {};
  for (const r of data ?? []) seen[r.section_key] = r.seen_ids ?? [];
  return NextResponse.json({ seen });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === 'string' ? body.key.slice(0, 80) : '';
  // Cap the array to keep the row size sane; sections in this app are <100 items.
  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.map((x: unknown) => String(x)))).slice(0, 5000)
    : null;
  if (!key || !ids) {
    return NextResponse.json({ error: 'key and ids[] are required' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.from('notification_seen').upsert({
    user_id: user.id,
    section_key: key,
    seen_ids: ids,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,section_key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
