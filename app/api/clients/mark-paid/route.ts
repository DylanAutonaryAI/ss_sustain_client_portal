import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// One-click "Payment received" for a manually-tracked (non-Stripe) client.
// Effect, in one call:
//   1. Logs a Paid payment into the ledger (feeds Collected / YTD / breakdown).
//   2. Rolls next_payment_date forward one month (so the roster pill goes green
//      and the client drops out of "chase" until next month).
// Body: { id: <clients.id>, amount?: number }. If amount is omitted, the
// client's saved monthly_amount is used. Coach-only.

// Add one calendar month to a YYYY-MM-DD, clamping to the last day of the target
// month so e.g. Jan 31 → Feb 28 rather than rolling into March.
function addMonthISO(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(Date.UTC(y, m, 1)); // m is 0-based next month (m-1 + 1)
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

// London-local "today" (YYYY-MM-DD). Using UTC would misattribute a payment
// logged in the first hour after UK midnight during BST to the previous day
// (and previous month at a boundary), skewing the revenue ledger.
function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();
  const { data: client, error: fetchErr } = await admin
    .from('clients')
    .select('id, full_name, email, next_payment_date, monthly_amount')
    .eq('id', id)
    .eq('coach_id', user.id)
    .maybeSingle();
  if (fetchErr || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  // Amount: explicit override, else the saved monthly rate. Must be > 0 to log.
  const amount = body.amount != null ? Number(body.amount) : (client.monthly_amount != null ? Number(client.monthly_amount) : NaN);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Set a monthly amount for this client first (or pass an amount).' }, { status: 400 });
  }

  const today = todayISO();
  // Advance from the current due date if it's in the future (paying early keeps
  // the cycle anchored); otherwise from today (an overdue payment resets to a
  // month out rather than landing in the past / immediately due again).
  const base = client.next_payment_date && client.next_payment_date >= today ? client.next_payment_date : today;
  const nextPaymentDate = addMonthISO(base);

  const { error: payErr } = await admin.from('payments').insert({
    coach_id: user.id,
    id: `pay-${Date.now()}`,
    client_id: client.id,
    client_name: client.full_name ?? client.email ?? 'Client',
    amount: Math.round(amount * 100) / 100,
    status: 'Paid',
    paid_at: today,
  });
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const { error: updErr } = await admin
    .from('clients')
    .update({ next_payment_date: nextPaymentDate })
    .eq('id', client.id)
    .eq('coach_id', user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, nextPaymentDate, amount });
}
