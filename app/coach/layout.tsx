import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachShell from '@/components/layout/CoachShell';

// Server-side route protection (Node runtime, not edge — see app/portal/layout.tsx
// for why). Hard gate: no session → /login; a client hitting the coach dashboard
// → their portal.
export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // FAIL CLOSED: require a positive coach role. A null role (role-less account,
  // missing profiles row, or a transient get_my_role failure) must NOT render
  // the coach dashboard — send it to the least-privileged area instead. The
  // portal layout deliberately tolerates null (so a transient blip can't lock a
  // real client out), and every coach API re-validates the role independently.
  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') redirect('/portal/home');

  return <CoachShell>{children}</CoachShell>;
}
