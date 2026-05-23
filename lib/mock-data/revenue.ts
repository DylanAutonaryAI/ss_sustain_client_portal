import type { RevenueRow } from '@/lib/types';

export const revenueRows: RevenueRow[] = [
  { id: '1', month: 'April 2025',    clients: 67, mrr: '£9,849',  status: 'In progress' },
  { id: '2', month: 'March 2025',    clients: 64, mrr: '£9,408',  status: 'Complete'    },
  { id: '3', month: 'February 2025', clients: 61, mrr: '£8,967',  status: 'Complete'    },
  { id: '4', month: 'January 2025',  clients: 58, mrr: '£8,526',  status: 'Complete'    },
];

export const revenueStats = {
  mrr:              '£9,849',
  mrrChange:        '+4.7%',
  collected:        '£9,261',
  outstanding:      '£588',
  outstandingCount: 4,
  ytd:              '£38,440',
  activeClients:    67,
  avgPerClient:     '£147',
  projectedAnnual:  '£118,188',
};

export const forecastMonths = [
  { label: 'April 2025 (now)', mrr: '£9,849',  clients: 67,   current: true  },
  { label: 'May 2025',         mrr: '£10,290', clients: 70,   current: false },
  { label: 'June 2025',        mrr: '£10,731', clients: 73,   current: false },
];
