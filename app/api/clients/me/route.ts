import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Returns the signed-in CLIENT's own roster row (the phase + program start that
// drive the portal top-bar). Scoped to user_id, so a client only ever sees
// their own record. Coaches (no client row) get { client: null }.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('clients')
    .select('goal, program_start, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client: data ?? null });
}
