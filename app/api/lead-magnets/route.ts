import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Coach-only read/manage of website lead-magnet signups.
//   GET    → all leads, newest first.
//   PATCH  → archive / unarchive a lead.
//   DELETE → remove a lead for good.
// One shared list for the business (single coach today); the role check keeps it
// coach-only. All access via the service-role admin client.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireCoach(): Promise<{ error: NextResponse } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true };
}

export async function GET() {
  const auth = await requireCoach();
  if ('error' in auth) return auth.error;

  const admin = await createAdminClient();
  const { data } = await admin.from('lead_magnet_leads')
    .select('id, name, email, source, created_at, archived_at')
    .order('created_at', { ascending: false })
    .limit(2000);

  const leads = (data ?? []).map((l) => ({
    id: l.id, name: l.name, email: l.email, source: l.source,
    createdAt: l.created_at, archived: !!l.archived_at,
  }));
  return NextResponse.json({ leads });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCoach();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin.from('lead_magnet_leads')
    .update({ archived_at: body.archived === false ? null : new Date().toISOString() })
    .eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCoach();
  if ('error' in auth) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin.from('lead_magnet_leads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
