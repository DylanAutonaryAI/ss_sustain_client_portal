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

  const { data: role } = await supabase.rpc('get_my_role');
  if (role === 'client') redirect('/portal/home');

  return <CoachShell>{children}</CoachShell>;
}
