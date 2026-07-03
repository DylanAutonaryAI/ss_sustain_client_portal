'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MobileNavProvider } from '@/context/MobileNavContext';
import CoachSidebar from '@/components/layout/CoachSidebar';

// Client shell for the coach dashboard. Auth + role are enforced server-side in
// app/coach/layout.tsx (redirects before this renders); this just covers a
// client-side role change without a full reload.
export default function CoachShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'client') router.push('/portal/home');
  }, [user, router]);

  return (
    <MobileNavProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <CoachSidebar />
        {/* Sidebar is a drawer below lg, docked (220px) at lg+ */}
        <main className="flex-1 min-w-0 min-h-screen lg:ml-[220px]">
          {children}
        </main>
      </div>
    </MobileNavProvider>
  );
}
