import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PortalShell from '@/components/layout/PortalShell';

// Server-side route protection: validate the session from cookies BEFORE any
// portal content renders. This runs in the Node runtime (a server component),
// NOT the edge — so it avoids the MIDDLEWARE_INVOCATION_FAILED edge crash that
// forced middleware.ts to be removed. Hard gate: no session → /login; a coach
// hitting the portal → their dashboard. Onboarding gating + per-section view
// tracking stay client-side in PortalShell.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Coaches are bounced to their dashboard. A null role is deliberately ALLOWED
  // here (unlike the coach layout, which fails closed): the portal is the
  // least-privileged area, every portal API re-validates + scopes to the caller,
  // and bouncing null to /login would lock real clients out on a transient
  // get_my_role blip.
  const { data: role } = await supabase.rpc('get_my_role');
  if (role === 'coach') redirect('/coach/overview');

  return <PortalShell>{children}</PortalShell>;
}
