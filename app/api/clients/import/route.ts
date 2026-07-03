import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';

// Bulk-import existing clients into the coach's roster (e.g. migrating Sam's
// current roster off Notion). Each imported client is created as PENDING
// (user_id null, access_granted_at null, NO invite email) so the coach can
// review the list before inviting anyone — then grant access in a batch via
// /api/clients/grant-access-all. Imported clients are stamped
// onboarding_completed_at = now() so they SKIP the portal onboarding (they've
// already been coaching, done Sam's real onboarding elsewhere).
//
// Body: { clients: [{ full_name, email, phone?, goal? }, ...] }
// Returns per-row results so the UI can show what was added / skipped / failed.

interface ImportRow { full_name?: unknown; email?: unknown; phone?: unknown; goal?: unknown }
type Outcome = { email: string; name: string; status: 'added' | 'duplicate' | 'invalid'; reason?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const rows: ImportRow[] = Array.isArray(body.clients) ? body.clients : [];
  // skipOnboarding (default true): existing clients bypass the portal onboarding
  // flow. Set false to route imported clients THROUGH onboarding (e.g. clients
  // who haven't done Sam's onboarding yet).
  const skipOnboarding = body.skipOnboarding !== false;
  if (rows.length === 0) return NextResponse.json({ error: 'No rows to import.' }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: 'Too many rows (max 500 per import).' }, { status: 400 });

  const admin = await createAdminClient();

  // Existing emails on THIS coach's roster (case-insensitive) — skip dupes.
  const { data: existing } = await admin
    .from('clients')
    .select('email')
    .eq('coach_id', user.id);
  const existingEmails = new Set((existing ?? []).map((r) => (r.email ?? '').toLowerCase()));

  const since = `Since ${new Date().toLocaleString('en-GB', { month: 'short' })} ${new Date().getFullYear()}`;
  const nowIso = new Date().toISOString();

  const outcomes: Outcome[] = [];
  const toInsert: Record<string, unknown>[] = [];
  const seenThisBatch = new Set<string>();

  for (const raw of rows) {
    const name = typeof raw.full_name === 'string' ? raw.full_name.trim() : '';
    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
    const emailLc = email.toLowerCase();
    const phone = typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone.trim() : null;
    const goal = typeof raw.goal === 'string' && raw.goal.trim() ? raw.goal.trim() : null;

    if (!name || !email || !EMAIL_RE.test(email)) {
      outcomes.push({ email, name, status: 'invalid', reason: !name ? 'missing name' : 'invalid email' });
      continue;
    }
    if (existingEmails.has(emailLc) || seenThisBatch.has(emailLc)) {
      outcomes.push({ email, name, status: 'duplicate' });
      continue;
    }
    seenThisBatch.add(emailLc);
    outcomes.push({ email, name, status: 'added' });
    toInsert.push({
      user_id: null,
      coach_id: user.id,
      full_name: name,
      email,
      phone,
      goal,
      status: 'Active',
      since,
      referral_code: generateReferralCode(name),
      access_granted_at: null,                                  // pending — no invite yet
      onboarding_completed_at: skipOnboarding ? nowIso : null,  // skip vs route through onboarding
    });
  }

  if (toInsert.length > 0) {
    const { error } = await admin.from('clients').insert(toInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const added = outcomes.filter((o) => o.status === 'added').length;
  const duplicate = outcomes.filter((o) => o.status === 'duplicate').length;
  const invalid = outcomes.filter((o) => o.status === 'invalid').length;
  return NextResponse.json({ added, duplicate, invalid, outcomes });
}
