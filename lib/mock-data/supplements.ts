import type { Supplement } from '@/lib/types';

export const supplements: Supplement[] = [
  {
    id: '1',
    icon: '💊',
    name: 'Creatine Monohydrate',
    description: '5g daily — any time, with food or water. No loading phase needed.',
    essential: true,
  },
  {
    id: '2',
    icon: '🥤',
    name: 'Whey Protein',
    description: 'Use to hit your daily protein target. 1–2 scoops post-training or as needed.',
    essential: true,
  },
  {
    id: '3',
    icon: '☀️',
    name: 'Vitamin D3 + K2',
    description: '2000–4000 IU D3 daily. Take with a meal containing fat for best absorption.',
    essential: true,
  },
  {
    id: '4',
    icon: '🐟',
    name: 'Omega-3 Fish Oil',
    description: '2–3g EPA/DHA daily. Anti-inflammatory, joint health, recovery.',
    essential: true,
  },
  {
    id: '5',
    icon: '⚡',
    name: 'Caffeine / Pre-Workout',
    description: '150–200mg 30 min pre-training. Cycle off every 4–6 weeks.',
    essential: false,
  },
  {
    id: '6',
    icon: '😴',
    name: 'Magnesium Glycinate',
    description: '300–400mg before bed. Improves sleep quality and muscle recovery.',
    essential: false,
  },
];
