import type { CoachMessage } from '@/lib/types';

export const clientMessages: CoachMessage[] = [
  {
    id: '1',
    fromInitials: 'SC',
    from: 'Coach SS',
    time: 'Today, 9:42am',
    body: "Dylan — solid week. Scale moved in the right direction and your training adherence was on point. I've bumped your calories by 150 and added an extra working set to hack squat. You're responding well to the volume so let's push it. Keep the protein high and don't skip the post-session stretch.",
    unread: true,
  },
  {
    id: '2',
    fromInitials: 'SC',
    from: 'Coach SS',
    time: '6 days ago',
    body: "Good effort this week considering you mentioned work was manic. One thing — your sleep average dropped to 5.8hrs. That's going to blunt your recovery and your gains. Prioritise it this week, even if that means one less hour in the evening. Sleep is training.",
    unread: true,
  },
  {
    id: '3',
    fromInitials: 'SC',
    from: 'Coach SS',
    time: '2 weeks ago',
    body: "Week 6 check-in reviewed. You're 2.1kg up from the start of the bulk with your waist measurement staying stable — exactly what we want. Strength is tracking upward on all main lifts. We're in a good place. Keep the momentum.",
    unread: false,
  },
];

export const coachMessageHistory: Record<string, { date: string; body: string; read: boolean }[]> = {
  'Dylan Y.': [
    { date: 'Sent today 9:42am', body: "Dylan — solid week. Scale moved in the right direction and your training adherence was on point. I've bumped your calories by 150 and added an extra working set to hack squat. You're responding well to the volume so let's push it.", read: true },
    { date: 'Sent 6 days ago', body: "Good effort this week considering work was manic. One thing — sleep average dropped to 5.8hrs. Prioritise it. Sleep is training.", read: true },
  ],
  'James M.': [
    { date: 'Sent 3 days ago', body: "James — great progress on the fat loss. Down another 0.6kg this week. Keep calories where they are and don't drop any lower. Cardio is doing its job.", read: true },
  ],
  'Connor R.': [
    { date: 'Sent yesterday', body: "Connor — your squat form is coming together. Watch the video I uploaded on leg drive. Hit a new PB this week and you earned it.", read: false },
  ],
  'Tom H.': [
    { date: 'Sent 2 weeks ago', body: "Tom — checking in. Haven't heard from you this week. Everything ok? Let me know how you're getting on with the programme.", read: false },
  ],
  'Aaron K.': [
    { date: 'Sent before pause', body: "Aaron — enjoy the holiday. We'll pick up exactly where we left off. Don't stress about food while you're away.", read: true },
  ],
};
