import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — all payments for the signed-in coach (most recent first).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('coach_id', user.id)
    .order('paid_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payments = (data ?? []).map(p => ({
    id: p.id,
    client_id: p.client_id,
    client_name: p.client_name ?? 'Client',
    amount: Number(p.amount) || 0,
    status: p.status ?? 'Paid',
    paid_at: p.paid_at,
  }));

  return NextResponse.json({ payments });
}

// POST — log a payment. Coach-only.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { client_id, client_name, amount, status, paid_at } = await request.json();
  const amt = Number(amount);
  if (isNaN(amt) || amt < 0) return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });

  const { error } = await supabase.from('payments').insert({
    coach_id: user.id,
    id: `pay-${Date.now()}`,
    client_id: client_id ?? null,
    client_name: client_name ?? 'Client',
    amount: amt,
    status: status ?? 'Paid',
    paid_at: paid_at || new Date().toISOString().slice(0, 10),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a logged payment (corrections). Coach-only.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('payments').delete().eq('coach_id', user.id).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
