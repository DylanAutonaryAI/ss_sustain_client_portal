import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Public endpoint — records a referral lead when a friend uses someone's
// /join?ref=CODE link. No auth required; runs with the service role.
export async function POST(request: NextRequest) {
  const { ref, name, email } = await request.json();

  if (!ref || typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Please enter your name and email.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const admin = await createAdminClient();

  const { data: referrer } = await admin
    .from('clients')
    .select('id')
    .eq('referral_code', ref)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: 'This referral link is no longer valid.' }, { status: 404 });
  }

  const { error } = await admin.from('referral_leads').insert({
    referrer_id: referrer.id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
