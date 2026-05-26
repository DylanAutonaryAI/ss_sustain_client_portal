'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import ClientSidebar from '@/components/layout/ClientSidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('ss-user');
      if (!stored) { router.push('/'); return; }
    } else if (user.role === 'coach') {
      router.push('/coach/overview');
      return;
    }
    const onboardingDone = localStorage.getItem('ss-onboarding-done');
    if (!onboardingDone) router.push('/onboarding');
  }, [user, router]);

  // Stamp the client's last activity once per browser session (no-op for coaches).
  useEffect(() => {
    if (sessionStorage.getItem('ss-activity-stamped')) return;
    createClient().rpc('touch_last_login')
      .then(
        () => sessionStorage.setItem('ss-activity-stamped', '1'),
        () => {},
      );
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <ClientSidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  );
}
