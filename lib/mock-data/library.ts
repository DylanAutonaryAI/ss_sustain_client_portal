import type { PdfResource, Recommendation } from '@/lib/types';

export const pdfResources: PdfResource[] = [
  { id: '1', title: 'The Sustain Way — Mindset Guide',    meta: 'PDF · 12 pages' },
  { id: '2', title: 'Weekly Meal Prep Blueprint',         meta: 'PDF · 8 pages'  },
  { id: '3', title: 'Supplement Timing Cheat Sheet',      meta: 'PDF · 2 pages'  },
  { id: '4', title: 'Posing Practice Schedule — 8 Weeks', meta: 'PDF · 4 pages'  },
  { id: '5', title: 'Eating Out & Social Events Guide',   meta: 'PDF · 6 pages'  },
];

export const recommendations: Recommendation[] = [
  { id: '1', icon: '🎒', title: 'Gym Bag Essentials',      subtitle: 'What to bring to every session' },
  { id: '2', icon: '🛒', title: 'Weekly Shopping List',    subtitle: 'Makes hitting macros effortless' },
  { id: '3', icon: '⚡', title: 'Daily Non-Negotiables',   subtitle: 'The habits that separate consistent athletes' },
  { id: '4', icon: '📱', title: 'Apps & Tools',            subtitle: 'What your coach uses day to day' },
];
