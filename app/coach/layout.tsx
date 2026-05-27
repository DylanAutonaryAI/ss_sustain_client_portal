'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CoachSidebar from '@/components/layout/CoachSidebar';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // Only redirect a logged-in CLIENT away to their portal. Do NOT bounce on a
  // null `user` while the auth profile is still loading — that's what made coach
  // login flash the dashboard then reset to /login (stale `ss-user` key is gone).
  // Auth is enforced by the API routes; full route protection is reinstated separately.
  useEffect(() => {
    if (user?.role === 'client') router.push('/portal/home');
  }, [user, router]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <CoachSidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  );
}
