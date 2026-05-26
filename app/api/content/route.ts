import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Each frontend content section ↔ its Supabase table. `toRow` maps a frontend
// item (camelCase) to a DB row (snake_case); `fromRow` does the reverse.
interface SectionConfig {
  table: string;
  toRow: (item: any, coachId: string, sortOrder: number) => Record<string, any>;
  fromRow: (row: any) => Record<string, any>;
}

const SECTIONS: Record<string, SectionConfig> = {
  announcements: {
    table: 'announcements',
    toRow: (a, coach_id, sort_order) => ({ id: a.id, coach_id, sort_order, icon: a.icon ?? '', title: a.title ?? '', body: a.body ?? '', time: a.time ?? '', accent_color: a.accentColor ?? null }),
    fromRow: (r) => ({ id: r.id, icon: r.icon ?? '', title: r.title ?? '', body: r.body ?? '', time: r.time ?? '', ...(r.accent_color ? { accentColor: r.accent_color } : {}) }),
  },
  supplements: {
    table: 'supplements',
    toRow: (s, coach_id, sort_order) => ({ id: s.id, coach_id, sort_order, icon: s.icon ?? '', name: s.name ?? '', description: s.description ?? '', essential: !!s.essential, url: s.url ?? null }),
    fromRow: (r) => ({ id: r.id, icon: r.icon ?? '', name: r.name ?? '', description: r.description ?? '', essential: !!r.essential, ...(r.url ? { url: r.url } : {}) }),
  },
  mindsetTips: {
    table: 'mindset_tips',
    toRow: (t, coach_id, sort_order) => ({ id: t.id, coach_id, sort_order, title: t.title ?? '', body: t.body ?? '' }),
    fromRow: (r) => ({ id: r.id, title: r.title ?? '', body: r.body ?? '' }),
  },
  gymBag: {
    table: 'gym_bag',
    toRow: (g, coach_id, sort_order) => ({ id: g.id, coach_id, sort_order, name: g.name ?? '', description: g.desc ?? '', link_label: g.linkLabel ?? '', link_url: g.linkUrl ?? '' }),
    fromRow: (r) => ({ id: r.id, name: r.name ?? '', desc: r.description ?? '', linkLabel: r.link_label ?? '', linkUrl: r.link_url ?? '' }),
  },
  shopping: {
    table: 'shopping_items',
    toRow: (s, coach_id, sort_order) => ({ id: s.id, coach_id, sort_order, name: s.name ?? '', category: s.category ?? 'Other' }),
    fromRow: (r) => ({ id: r.id, name: r.name ?? '', category: r.category ?? 'Other' }),
  },
  nonNeg: {
    table: 'non_negotiables',
    toRow: (n, coach_id, sort_order) => ({ id: n.id, coach_id, sort_order, label: n.label ?? '', description: n.desc ?? '' }),
    fromRow: (r) => ({ id: r.id, label: r.label ?? '', desc: r.description ?? '' }),
  },
  webinars: {
    table: 'webinars',
    toRow: (w, coach_id, sort_order) => ({ id: w.id, coach_id, sort_order, month: w.month ?? '', day: w.day ?? '', title: w.title ?? '', meta: w.meta ?? '', recorded: w.recorded ?? null, recorded_date: w.recordedDate ?? null, tag: w.tag ?? null, url: w.url ?? null }),
    fromRow: (r) => ({ id: r.id, month: r.month ?? '', day: r.day ?? '', title: r.title ?? '', meta: r.meta ?? '', ...(r.recorded != null ? { recorded: r.recorded } : {}), ...(r.recorded_date ? { recordedDate: r.recorded_date } : {}), ...(r.tag ? { tag: r.tag } : {}), ...(r.url ? { url: r.url } : {}) }),
  },
  trainingVideos: {
    table: 'training_videos',
    toRow: (v, coach_id, sort_order) => ({ id: v.id, coach_id, sort_order, tag: v.tag ?? '', title: v.title ?? '', meta: v.meta ?? '', url: v.url ?? null }),
    fromRow: (r) => ({ id: r.id, tag: r.tag ?? '', title: r.title ?? '', meta: r.meta ?? '', ...(r.url ? { url: r.url } : {}) }),
  },
  posingVideos: {
    table: 'posing_videos',
    toRow: (v, coach_id, sort_order) => ({ id: v.id, coach_id, sort_order, label: v.label ?? '', youtube_url: v.youtubeUrl ?? '' }),
    fromRow: (r) => ({ id: r.id, label: r.label ?? '', youtubeUrl: r.youtube_url ?? '' }),
  },
  posingTips: {
    table: 'posing_tips',
    toRow: (t, coach_id, sort_order) => ({ id: t.id, coach_id, sort_order, tip_key: t.key ?? '', body: t.body ?? '' }),
    fromRow: (r) => ({ id: r.id, key: r.tip_key ?? '', body: r.body ?? '' }),
  },
  pdfResources: {
    table: 'pdf_resources',
    toRow: (p, coach_id, sort_order) => ({ id: p.id, coach_id, sort_order, title: p.title ?? '', meta: p.meta ?? '', url: p.url ?? null }),
    fromRow: (r) => ({ id: r.id, title: r.title ?? '', meta: r.meta ?? '', ...(r.url ? { url: r.url } : {}) }),
  },
};

// Resolve which coach's content the signed-in user should see:
// a coach sees their own; a client sees the coach who invited them.
async function resolveCoachId(supabase: any, userId: string): Promise<string | null> {
  const { data: role } = await supabase.rpc('get_my_role');
  if (role === 'coach') return userId;
  const { data: clientRow } = await supabase
    .from('clients')
    .select('coach_id')
    .eq('user_id', userId)
    .maybeSingle();
  return clientRow?.coach_id ?? null;
}

// GET — return every content section as { content: { announcements: [...], ... } }.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const coachId = await resolveCoachId(supabase, user.id);
  const content: Record<string, unknown[]> = {};

  if (!coachId) return NextResponse.json({ content });

  await Promise.all(
    Object.entries(SECTIONS).map(async ([key, cfg]) => {
      const { data, error } = await supabase
        .from(cfg.table)
        .select('*')
        .eq('coach_id', coachId)
        .order('sort_order', { ascending: true });
      if (!error && data) content[key] = data.map(cfg.fromRow);
    })
  );

  return NextResponse.json({ content });
}

// PUT — replace one section's items. Body: { key, value }. Coach-only.
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key, value } = await request.json();
  const cfg = SECTIONS[key as string];
  if (!cfg) return NextResponse.json({ error: `Unknown content section: ${key}` }, { status: 400 });
  if (!Array.isArray(value)) return NextResponse.json({ error: 'value must be an array' }, { status: 400 });

  // Replace the whole section: clear this coach's rows, then insert the new array.
  const { error: delErr } = await supabase.from(cfg.table).delete().eq('coach_id', user.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (value.length > 0) {
    const rows = value.map((item: any, i: number) => cfg.toRow(item, user.id, i));
    const { error: insErr } = await supabase.from(cfg.table).insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
