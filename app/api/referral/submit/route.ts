import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// Public endpoint — records a referral lead when a friend uses someone's
// /join?ref=CODE link. No auth (runs with the service role). Hardened against:
//   • spam / lead-flooding → per-IP rate limit + a unique (referrer, email) index
//     (duplicate inserts are ignored, not errored);
//   • self-referral farming → a lead whose email matches the referrer's own is
//     silently dropped;
//   • code-enumeration → the response is identical for valid/invalid/self codes
//     ({ ok: true }), so it never reveals whether a code exists.
export async function POST(request: NextRequest) {
  const { ref, name, email } = await request.json().catch(() => ({}));

  if (!ref || typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Please enter your name and email.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (!(await rateLimit(`referral-submit:${ip}`, 10, 60 * 60))) {
    return NextResponse.json({ error: 'Too many submissions — please try again later.' }, { status: 429 });
  }

  const admin = await createAdminClient();
  const emailLc = email.trim().toLowerCase();

  const { data: referrer } = await admin
    .from('clients')
    .select('id, email')
    .eq('referral_code', ref)
    .maybeSingle();

  // Only record for a real code that isn't a self-referral. Either way we return
  // the SAME success payload so the endpoint can't be used to test code validity.
  if (referrer && (referrer.email ?? '').toLowerCase() !== emailLc) {
    const { error } = await admin.from('referral_leads').insert({
      referrer_id: referrer.id,
      name: name.trim(),
      email: emailLc,
    });
    // Swallow ALL insert errors (dup 23505 or otherwise) — never surface a status
    // that differs from the invalid-code path, so the endpoint can't be used to
    // test code validity. Log for observability; the caller always sees ok.
    if (error) console.error('[referral/submit] insert error:', error.message);
  }

  return NextResponse.json({ ok: true });
}
