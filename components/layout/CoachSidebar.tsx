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
        { label: 'Client Health',  href: '/coach/health',    icon: Icons.pulse },
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
      label: 'Community',
      items: [
        { label: 'Community Events', href: '/coach/community', icon: Icons.calendar },
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
      userAvatar="/samlogo.jpg"
      userRole="Backend dashboard"
      isCoach={true}
    />
  );
}
