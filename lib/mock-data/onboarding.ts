import type { OnboardingStep } from '@/lib/types';

export const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    type: 'video',
    title: 'Welcome to SS Sustain',
    duration: '2 min',
    description: "A personal message from Coach Sam. What you've signed up for, what to expect, and how this journey works.",
  },
  {
    id: '2',
    type: 'video',
    title: 'How to Use Your Portal',
    duration: '3 min',
    description: 'A walkthrough of every section — training clips, coach messages, supplements, webinars, and more.',
  },
  {
    id: '3',
    type: 'video',
    title: 'Your First Week — What to Expect',
    duration: '5 min',
    description: "What happens in week one: your programme, your macros, your first check-in. Don't skip this.",
  },
  {
    id: '4',
    type: 'video',
    title: 'The SS Sustain Method',
    duration: '8 min',
    description: 'The philosophy behind the coaching — why consistency beats intensity, and how we measure progress.',
  },
  {
    id: '5',
    type: 'doc',
    title: 'Complete your intake form',
    description: "Make a copy of Sam's Google doc intake form, fill it in fully, and send it back. This lets Sam personalise your programme from day one.",
    actionLabel: 'Open intake form',
  },
  {
    id: '6',
    type: 'action',
    title: 'Accept your Google Sheets invite',
    description: 'Check your email for an invite to your personal tracking spreadsheet. Accept it — this is where your weekly check-ins will live.',
    actionLabel: 'Mark as accepted',
  },
  {
    id: '7',
    type: 'doc',
    title: 'How to do your weekly check-in',
    description: "Your weekly check-in is the most important thing you do in this programme. Read this guide now so your first check-in is done correctly — photos, metrics, and summary all in the right place.",
    actionLabel: 'Open check-in guide',
    url: '/pdfs/check-in-process.pdf',
  },
  {
    id: '8',
    type: 'doc',
    title: 'Read your welcome pack',
    description: 'Your full SS Sustain welcome pack covers everything you need to know before your first week. Read it end-to-end before moving on.',
    actionLabel: 'Open welcome pack',
    url: '/pdfs/welcome-guide.pdf',
  },
  {
    id: '9',
    type: 'action',
    title: 'Sign your coaching agreement',
    description: 'Sign and date the coaching agreement and send it back to Sam. Once this is done, your portal access is fully unlocked.',
    actionLabel: 'Mark as signed & sent',
  },
];
