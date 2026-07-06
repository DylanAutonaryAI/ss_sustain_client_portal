import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Coach-only: ONE client's onboarding intake answers + welcome-pack signature,
// for the expanded roster row (lazy-loaded when the row opens). Scoped to the
// caller's own clients — a coach can't read another coach's client.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clientId = new URL(request.url).searchParams.get('id');
  if (!clientId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const admin = await createAdminClient();

  // Confirm the client is this coach's, and pull the signature fields.
  const { data: client } = await admin
    .from('clients')
    .select('id, welcome_pack_signed_name, welcome_pack_signed_at')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { data: q } = await admin
    .from('onboarding_questionnaire')
    .select('answers, submitted_at, updated_at')
    .eq('client_id', clientId)
    .maybeSingle();

  return NextResponse.json({
    answers: q?.answers ?? null,
    submittedAt: q?.updated_at ?? q?.submitted_at ?? null,
    signedName: client.welcome_pack_signed_name ?? null,
    signedAt: client.welcome_pack_signed_at ?? null,
  });
}
