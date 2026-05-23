import type { Announcement } from '@/lib/types';

export const announcements: Announcement[] = [
  {
    id: '1',
    icon: '📣',
    title: 'Nutrition Deep Dive webinar — April 20th',
    body: 'Bulking without gaining fat. Register your spot in the Webinars section. Live on Zoom, 7pm GMT.',
    time: '2d ago',
  },
  {
    id: '2',
    icon: '💪',
    title: 'Week 8 programme update',
    body: "Extra set added to hack squat, calories up by 150. You're responding well — keep pushing.",
    time: '5d ago',
    accentColor: 'var(--blue)',
  },
];
