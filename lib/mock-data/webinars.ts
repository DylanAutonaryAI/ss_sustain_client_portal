import type { Webinar } from '@/lib/types';

export const upcomingWebinars: Webinar[] = [
  {
    id: '1',
    month: 'Apr',
    day: '20',
    title: 'Nutrition Deep Dive — Bulking Without Getting Fat',
    meta: 'Live via Zoom · 7:00pm GMT · 60 minutes',
  },
  {
    id: '2',
    month: 'May',
    day: '04',
    title: 'Training Volume — How Much Is Too Much?',
    meta: 'Live via Zoom · 7:00pm GMT · 45 minutes',
  },
];

export const recordedWebinars: Webinar[] = [
  { id: '3', month: '', day: '', title: 'Hitting Macros on a Budget',           meta: 'Mar 15 · 55 min', tag: 'Nutrition', recorded: true },
  { id: '4', month: '', day: '', title: 'Progressive Overload — The Right Way', meta: 'Feb 28 · 48 min', tag: 'Training',  recorded: true },
  { id: '5', month: '', day: '', title: 'Staying Consistent Through Life',      meta: 'Feb 10 · 40 min', tag: 'Mindset',   recorded: true },
];
