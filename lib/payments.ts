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

// MRR = sum of each ACTIVE client's agreed monthly rate. Prefer the explicit
// monthlyAmount (set at import, in the roster, or by the Stripe webhook); fall
// back to their most recent Paid amount when no rate is set, so nothing
// regresses for clients tracked only via the payment ledger. Single source of
// truth so the overview / revenue / forecast pages never disagree.
export function computeMrr(payments: Payment[], clients: Client[]): number {
  const latestPaid: Record<string, { date: string; amount: number }> = {};
  for (const p of payments) {
    if (p.status !== 'Paid' || !p.client_id) continue;
    const cur = latestPaid[p.client_id];
    if (!cur || p.paid_at > cur.date) latestPaid[p.client_id] = { date: p.paid_at, amount: p.amount };
  }
  // Pending clients (imported / Stripe-paid but not yet invited) are excluded —
  // same "active relationship" definition the roster uses (status Active AND not
  // pending). A negative/zero rate can't drag MRR down: it's ignored in favour
  // of the ledger fallback.
  return clients
    .filter(c => c.status === 'Active' && !c.pending)
    .reduce((s, c) => {
      const rate = c.monthlyAmount != null && c.monthlyAmount > 0 ? c.monthlyAmount : (latestPaid[c.id]?.amount ?? 0);
      return s + rate;
    }, 0);
}
