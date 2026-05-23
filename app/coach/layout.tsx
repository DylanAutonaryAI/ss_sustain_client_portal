'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CoachSidebar from '@/components/layout/CoachSidebar';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('ss-user');
      if (!stored) router.push('/');
    } else if (user.role === 'client') {
      router.push('/portal/home');
    }
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
