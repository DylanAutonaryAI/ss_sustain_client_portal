import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

function getInitials(name: string) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

// Resolve the coach whose events this user belongs to, plus the user's display
// name. A coach owns their own events; a client belongs to their inviting coach.
async function getContext(supabase: any, userId: string, email: string | undefined) {
  const { data: role } = await supabase.rpc('get_my_role');
  if (role === 'coach') return { coachId: userId, role, name: null as string | null };
  const { data: clientRow } = await supabase
    .from('clients')
    .select('coach_id, full_name')
    .eq('user_id', userId)
    .maybeSingle();
  return { coachId: clientRow?.coach_id ?? null, role, name: clientRow?.full_name ?? email ?? 'Client' };
}

// GET — events for the user's coach, each with its RSVPs, plus the caller's identity.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { coachId, name } = await getContext(supabase, user.id, user.email);
  if (!coachId) return NextResponse.json({ events: [], myUserId: user.id, myName: name });

  const [{ data: events }, { data: rsvps }] = await Promise.all([
    supabase.from('community_events').select('*').eq('coach_id', coachId).order('date', { ascending: true }),
    supabase.from('event_rsvps').select('*').eq('coach_id', coachId),
  ]);

  const byEvent: Record<string, any[]> = {};
  for (const r of rsvps ?? []) (byEvent[r.event_id] ??= []).push(r);

  const mapped = (events ?? []).map((e: any) => ({
    id: e.id,
    title: e.title ?? '',
    description: e.description ?? '',
    type: e.type ?? 'live-call',
    date: e.date ?? '',
    time: e.time ?? '',
    duration: e.duration ?? '',
    ...(e.link ? { link: e.link } : {}),
    rsvps: (byEvent[e.id] ?? []).map((r: any) => ({
      clientId: r.user_id,
      clientName: r.client_name ?? 'Client',
      clientInitials: getInitials(r.client_name ?? 'Client'),
      status: r.status ?? 'pending',
      ...(r.reason ? { reason: r.reason } : {}),
    })),
  }));

  return NextResponse.json({ events: mapped, myUserId: user.id, myName: name });
}

// POST — coach creates an event.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ev = await request.json();
  if (!ev.id || !ev.title) return NextResponse.json({ error: 'id and title are required' }, { status: 400 });

  const { error } = await supabase.from('community_events').insert({
    coach_id: user.id,
    id: ev.id,
    title: ev.title,
    description: ev.description ?? '',
    type: ev.type ?? 'live-call',
    date: ev.date || null,
    time: ev.time ?? '',
    duration: ev.duration ?? '',
    link: ev.link || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — coach edits an event.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patch: Record<string, any> = {};
  for (const k of ['title', 'description', 'type', 'time', 'duration']) {
    if (k in updates) patch[k] = updates[k] ?? '';
  }
  if ('date' in updates) patch.date = updates.date || null;
  if ('link' in updates) patch.link = updates.link || null;

  const { error } = await supabase
    .from('community_events')
    .update(patch)
    .eq('coach_id', user.id)
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — coach removes an event and its RSVPs.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await supabase.from('event_rsvps').delete().eq('coach_id', user.id).eq('event_id', id);
  const { error } = await supabase.from('community_events').delete().eq('coach_id', user.id).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PUT — a client RSVPs to an event (attending / declined).
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId, status, reason } = await request.json();
  if (!eventId || !status) return NextResponse.json({ error: 'eventId and status are required' }, { status: 400 });

  const { coachId, name } = await getContext(supabase, user.id, user.email);
  if (!coachId) return NextResponse.json({ error: 'No coach linked to this account' }, { status: 400 });

  const { error } = await supabase.from('event_rsvps').upsert({
    event_id: eventId,
    user_id: user.id,
    coach_id: coachId,
    client_name: name ?? 'Client',
    status,
    reason: status === 'declined' ? (reason ?? null) : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'event_id,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
