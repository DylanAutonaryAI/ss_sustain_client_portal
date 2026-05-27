import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with each client's own profile data (avatar / nickname / birthday)
  // and their onboarding progress, so the coach roster shows both.
  const rows = data ?? [];
  const userIds = rows.map(r => r.user_id).filter((id): id is string => !!id);
  const clientIds = rows.map(r => r.id);

  const profileMap: Record<string, { avatar_url?: string; nickname?: string; birthday?: string }> = {};
  const progressMap: Record<string, number> = {};

  if (rows.length) {
    const admin = await createAdminClient();

    if (userIds.length) {
      const { data: profiles } = await admin.from('profiles').select('*').in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap[p.id] = { avatar_url: p.avatar_url, nickname: p.nickname, birthday: p.birthday };
      }
    }

    // Count completed onboarding steps per client.
    const { data: progress } = await admin
      .from('onboarding_progress')
      .select('client_id')
      .in('client_id', clientIds);
    for (const p of progress ?? []) {
      progressMap[p.client_id] = (progressMap[p.client_id] ?? 0) + 1;
    }
  }

  const enriched = rows.map(r => ({
    ...r,
    avatar_url: r.user_id ? profileMap[r.user_id]?.avatar_url ?? null : null,
    nickname:   r.user_id ? profileMap[r.user_id]?.nickname   ?? null : null,
    birthday:   r.user_id ? profileMap[r.user_id]?.birthday   ?? null : null,
    onboarding_steps_done: progressMap[r.id] ?? 0,
  }));

  return NextResponse.json({ clients: enriched });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Admin client bypasses RLS; we still scope every query to the caller's coach_id.
  const admin = await createAdminClient();

  // Fetch the row first so we can revoke the linked login (if any) and confirm ownership.
  const { data: row, error: fetchError } = await admin
    .from('clients')
    .select('id, user_id')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { error: deleteError } = await admin
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // If the client had an actual login, remove it too so deleting truly revokes access.
  if (row.user_id) {
    await admin.auth.admin.deleteUser(row.user_id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
