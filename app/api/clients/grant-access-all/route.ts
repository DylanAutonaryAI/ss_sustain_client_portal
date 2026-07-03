import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Grant access to EVERY pending client on the coach's roster in one batch —
// sends each the Supabase invite email, links their auth user, and stamps
// access_granted_at. Used after a bulk import (or to onboard a wave of pending
// clients at once). Idempotent per client (skips any already granted).
//
// Invites are sent SEQUENTIALLY with a small delay: Supabase/Resend rate-limit
// bursts of transactional email, so firing 33 at once can get some throttled.
// Returns per-client outcomes so the UI can report failures for a retry.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await createAdminClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const { data: pendingRows, error } = await admin
    .from('clients')
    .select('id, email, full_name, user_id')
    .eq('coach_id', user.id)
    .is('access_granted_at', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; email: string; status: 'invited' | 'skipped' | 'failed'; reason?: string }[] = [];
  let existingUsers: { id: string; email?: string }[] | null = null; // lazy-loaded on first "already registered"

  for (const row of pendingRows ?? []) {
    if (!row.email) { results.push({ id: row.id, email: '', status: 'failed', reason: 'no email' }); continue; }

    let userId: string | null = row.user_id;
    if (!userId) {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        row.email,
        { data: { full_name: row.full_name ?? '' }, redirectTo: `${siteUrl}/auth/callback` },
      );
      if (inviteError) {
        if (inviteError.message.includes('already been registered')) {
          if (!existingUsers) {
            const { data: list } = await admin.auth.admin.listUsers();
            existingUsers = list?.users ?? [];
          }
          userId = existingUsers.find((u) => u.email?.toLowerCase() === row.email!.toLowerCase())?.id ?? null;
        } else {
          results.push({ id: row.id, email: row.email, status: 'failed', reason: inviteError.message });
          await sleep(120);
          continue;
        }
      } else {
        userId = inviteData?.user?.id ?? null;
      }
    }

    const { error: updErr } = await admin
      .from('clients')
      .update({ user_id: userId, access_granted_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('coach_id', user.id);
    if (updErr) results.push({ id: row.id, email: row.email, status: 'failed', reason: updErr.message });
    else results.push({ id: row.id, email: row.email, status: 'invited' });

    await sleep(120); // gentle pacing so a burst of invites isn't rate-limited
  }

  const invited = results.filter((r) => r.status === 'invited').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  return NextResponse.json({ invited, failed, total: results.length, results });
}
