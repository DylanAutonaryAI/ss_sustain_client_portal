'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCommunity } from '@/context/CommunityContext';
import { useContent } from '@/context/ContentContext';
import { useUnseenCounts, useMarkActiveSeen, type UnseenEntry } from '@/lib/notifications';
import Sidebar, { NavSection } from './Sidebar';
import { Icons } from './icons';

export default function ClientSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { events } = useCommunity();
  const {
    trainingVideos, posingVideos, mindsetTips, supplements,
    gymBag, shopping, nonNeg, webinars, pdfResources,
  } = useContent();

  // Render badges only after mount so the localStorage-backed counts don't
  // disagree with the server-rendered (empty) markup.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Each section → the ids of the items currently in it. A new item (new id)
  // the client hasn't seen lights the badge until they open that tab.
  const entries: UnseenEntry[] = [
    { key: 'client:community',       href: '/portal/community',       ids: events.map((e) => e.id) },
    { key: 'client:training',        href: '/portal/training',        ids: trainingVideos.map((v) => v.id) },
    { key: 'client:posing',          href: '/portal/posing',          ids: posingVideos.map((v) => v.id) },
    { key: 'client:mindset',         href: '/portal/mindset',         ids: mindsetTips.map((m) => m.id) },
    { key: 'client:supplements',     href: '/portal/supplements',     ids: supplements.map((s) => s.id) },
    { key: 'client:recommendations', href: '/portal/recommendations', ids: [...gymBag, ...shopping, ...nonNeg].map((i) => i.id) },
    { key: 'client:webinars',        href: '/portal/webinars',        ids: webinars.map((w) => w.id) },
    { key: 'client:library',         href: '/portal/library',         ids: pdfResources.map((p) => p.id) },
  ];

  const counts = useUnseenCounts(entries);
  useMarkActiveSeen(entries, pathname);

  const badge = (key: string): number | undefined =>
    mounted && counts[key] > 0 ? counts[key] : undefined;

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Home', href: '/portal/home', icon: Icons.grid },
      ],
    },
    {
      label: 'Nutrition',
      items: [
        { label: 'Meal Tracker', href: '/portal/tracker', icon: Icons.utensils },
      ],
    },
    {
      label: 'Community',
      items: [
        { label: 'Events & Calls', href: '/portal/community', icon: Icons.calendar, badge: badge('client:community') },
      ],
    },
    {
      label: 'Training',
      items: [
        { label: 'Training Clips', href: '/portal/training', icon: Icons.barbell, badge: badge('client:training') },
        { label: 'Posing Area',    href: '/portal/posing',   icon: Icons.person,  badge: badge('client:posing') },
      ],
    },
    {
      label: 'Resources',
      items: [
        { label: 'Mindset',         href: '/portal/mindset',         icon: Icons.brain,   badge: badge('client:mindset') },
        { label: 'Supplements',     href: '/portal/supplements',     icon: Icons.pill,    badge: badge('client:supplements') },
        { label: 'Recommendations', href: '/portal/recommendations', icon: Icons.star,    badge: badge('client:recommendations') },
        { label: 'Webinars',        href: '/portal/webinars',        icon: Icons.monitor, badge: badge('client:webinars') },
        { label: 'Resource Library',href: '/portal/library',         icon: Icons.book,    badge: badge('client:library') },
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
