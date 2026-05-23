'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar, { NavSection } from './Sidebar';
import { Icons } from './icons';

export default function CoachSidebar() {
  const { user } = useAuth();

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
        { label: 'Client Roster',  href: '/coach/clients',   icon: Icons.users },
        { label: 'Client Health',  href: '/coach/health',    icon: Icons.pulse,   badge: 2, badgeColor: 'var(--red)' },
        { label: 'Client Messages',href: '/coach/messages',  icon: Icons.message, badge: 3 },
      ],
    },
    {
      label: 'Business',
      items: [
        { label: 'Revenue',             href: '/coach/revenue',     icon: Icons.dollar   },
        { label: 'Revenue Forecast',    href: '/coach/forecast',    icon: Icons.trendUp  },
        { label: 'Referral Leaderboard',href: '/coach/leaderboard', icon: Icons.users    },
        { label: 'Analytics',           href: '/coach/analytics',   icon: Icons.barChart },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Announcements',  href: '/coach/announcements', icon: Icons.announce },
        { label: 'Content Manager',href: '/coach/content',       icon: Icons.file     },
      ],
    },
  ];

  return (
    <Sidebar
      sections={sections}
      userName={user?.name ?? 'Coach'}
      userInitials={user?.initials ?? 'SC'}
      userRole="Backend dashboard"
      isCoach={true}
    />
  );
}
