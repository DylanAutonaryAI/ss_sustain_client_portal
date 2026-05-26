'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Payment, Client } from '@/lib/types';

export const formatGBP = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;

// Shared hook: load the coach's payment ledger from Supabase.
export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' });
      if (res.ok) setPayments((await res.json()).payments ?? []);
    } catch {
      /* keep what we have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { payments, loading, refetch };
}

// MRR = sum of each ACTIVE client's most recent paid amount (their current rate).
// Single source of truth so the overview + revenue page never disagree.
export function computeMrr(payments: Payment[], clients: Client[]): number {
  const latestPaid: Record<string, { date: string; amount: number }> = {};
  for (const p of payments) {
    if (p.status !== 'Paid' || !p.client_id) continue;
    const cur = latestPaid[p.client_id];
    if (!cur || p.paid_at > cur.date) latestPaid[p.client_id] = { date: p.paid_at, amount: p.amount };
  }
  return clients
    .filter(c => c.status === 'Active')
    .reduce((s, c) => s + (latestPaid[c.id]?.amount ?? 0), 0);
}
