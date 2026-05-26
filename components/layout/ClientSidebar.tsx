'use client';

import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import Sidebar, { NavSection } from './Sidebar';
import { Icons } from './icons';

export default function ClientSidebar() {
  const { user } = useAuth();
  const { pendingCount } = useCommunity();

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Home', href: '/portal/home', icon: Icons.grid },
      ],
    },
    {
      label: 'Community',
      items: [
        { label: 'Events & Calls', href: '/portal/community', icon: Icons.calendar, badge: pendingCount > 0 ? pendingCount : undefined },
      ],
    },
    {
      label: 'Training',
      items: [
        { label: 'Training Clips',href: '/portal/training',        icon: Icons.barbell, badge: 'New' },
        { label: 'Posing Area',   href: '/portal/posing',          icon: Icons.person },
      ],
    },
    {
      label: 'Resources',
      items: [
        { label: 'Mindset',         href: '/portal/mindset',        icon: Icons.brain },
        { label: 'Supplements',     href: '/portal/supplements',    icon: Icons.pill },
        { label: 'Recommendations', href: '/portal/recommendations',icon: Icons.star },
        { label: 'Webinars',        href: '/portal/webinars',       icon: Icons.monitor },
        { label: 'Resource Library',href: '/portal/library',        icon: Icons.book },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Refer a Friend', href: '/portal/referral', icon: Icons.users },
        { label: 'Settings',       href: '/portal/settings', icon: Icons.gear  },
      ],
    },
  ];

  return (
    <Sidebar
      sections={sections}
      userName={user?.nickname || user?.name || 'Client'}
      userInitials={user?.initials ?? '??'}
      userAvatar={user?.avatarUrl}
      userRole={user?.phase ?? 'Active client'}
      isCoach={false}
    />
  );
}
