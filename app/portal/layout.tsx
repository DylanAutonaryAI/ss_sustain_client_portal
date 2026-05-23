'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ClientSidebar from '@/components/layout/ClientSidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('ss-user');
      if (!stored) router.push('/');
    } else if (user.role === 'coach') {
      router.push('/coach/overview');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <ClientSidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
        {children}
      </main>
    </div>
  );
}
