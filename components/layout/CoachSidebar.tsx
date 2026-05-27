'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClientRoster } from '@/lib/clients';
import { useUnseenCounts, useMarkActiveSeen, type UnseenEntry } from '@/lib/notifications';
import Sidebar, { NavSection } from './Sidebar';
import { Icons } from './icons';

export default function CoachSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { clients } = useClientRoster();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Referral leads (new signups land here) — drives the Referrals badge.
  const [referralIds, setReferralIds] = useState<string[] | null>(null);
  useEffect(() => {
    fetch('/api/referral/manage', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.leads)) setReferralIds(d.leads.map((l: { id: number }) => String(l.id)));
      })
      .catch(() => {});
  }, []);

  // Same churn definition as the Overview page.
  const churnIds = clients
    .filter((c) => c.healthScore < 40 || c.payment === 'Overdue')
    .map((c) => c.id);

  const entries: UnseenEntry[] = [
    { key: 'coach:roster',    href: '/coach/clients',     ids: clients.map((c) => c.id) },
    { key: 'coach:health',    href: '/coach/health',      ids: churnIds },
    { key: 'coach:referrals', href: '/coach/leaderboard', ids: referralIds },
  ];

  const counts = useUnseenCounts(entries);
  useMarkActiveSeen(entries, pathname);

  const badge = (key: string): number | undefined =>
    mounted && counts[key] > 0 ? counts[key] : undefined;

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Overview', href: '/coach/overview', icon: Icons.grid },
      ],
    },
    {
      label: 'Clients',
      items: [
        { label: 'Client Roster', href: '/coach/clients', icon: Icons.users, badge: badge('coach:roster') },
        { label: 'Client Health', href: '/coach/health',  icon: Icons.pulse, badge: badge('coach:health'), badgeColor: 'var(--red)' },
      ],
    },
    {
      label: 'Business',
      items: [
        { label: 'Revenue',          href: '/coach/revenue',     icon: Icons.dollar   },
        { label: 'Revenue Forecast', href: '/coach/forecast',    icon: Icons.trendUp  },
        { label: 'Referrals',        href: '/coach/leaderboard', icon: Icons.users,    badge: badge('coach:referrals') },
        { label: 'Analytics',        href: '/coach/analytics',   icon: Icons.barChart },
      ],
    },
    {
      label: 'Community',
      items: [
        { label: 'Community Events', href: '/coach/community', icon: Icons.calendar },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Announcements',   href: '/coach/announcements', icon: Icons.announce },
        { label: 'Content Manager', href: '/coach/content',       icon: Icons.file     },
      ],
    },
  ];

  return (
    <Sidebar
      sections={sections}
      userName={user?.name ?? 'Coach'}
      userInitials={user?.initials ?? 'SC'}
      userAvatar="/samlogo.jpg"
      userRole="Backend dashboard"
      isCoach={true}
    />
  );
}
