import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Coach-only: EVERY one of this coach's clients who has submitted the intake
// questionnaire and/or signed the welcome pack — powers the Submissions tab.
// One call returns the full set (name + email + answers + signature), most
// recent first, scoped to the caller's own clients.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await createAdminClient();

  const { data: clients } = await admin
    .from('clients')
    .select('id, full_name, email, welcome_pack_signed_name, welcome_pack_signed_at')
    .eq('coach_id', user.id);
  const rows = clients ?? [];
  const ids = rows.map((c) => c.id);

  const qMap = new Map<string, { answers: Record<string, string>; submittedAt: string | null }>();
  if (ids.length) {
    const { data: qs } = await admin
      .from('onboarding_questionnaire')
      .select('client_id, answers, submitted_at, updated_at')
      .in('client_id', ids);
    for (const q of qs ?? []) {
      qMap.set(q.client_id, {
        answers: (q.answers ?? {}) as Record<string, string>,
        submittedAt: q.updated_at ?? q.submitted_at ?? null,
      });
    }
  }

  type Submission = {
    clientId: string; name: string | null; email: string | null;
    answers: Record<string, string> | null;
    submittedAt: string | null; signedName: string | null; signedAt: string | null;
  };
  const submissions: Submission[] = [];
  for (const c of rows) {
    const q = qMap.get(c.id);
    const hasQ = !!q && Object.keys(q.answers).length > 0;
    const hasSig = !!c.welcome_pack_signed_name;
    if (!hasQ && !hasSig) continue; // only clients who've actually submitted something
    submissions.push({
      clientId: c.id,
      name: c.full_name,
      email: c.email,
      answers: hasQ ? q!.answers : null,
      submittedAt: q?.submittedAt ?? null,
      signedName: c.welcome_pack_signed_name ?? null,
      signedAt: c.welcome_pack_signed_at ?? null,
    });
  }

  submissions.sort(
    (a, b) =>
      new Date(b.submittedAt ?? b.signedAt ?? 0).getTime() -
      new Date(a.submittedAt ?? a.signedAt ?? 0).getTime(),
  );

  return NextResponse.json({ submissions });
}
