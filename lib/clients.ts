'use client';

import { useState, useEffect, useCallback } from 'react';
import { calcPaymentStatus } from '@/context/ClientContext';
import type { Client, ClientStatus, PaymentStatus } from '@/lib/types';

// Supabase `clients` row (snake_case) → frontend Client shape (camelCase).
export interface ClientRow {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  goal: string | null;
  status: string | null;
  next_payment_date: string | null;
  program_start: string | null;
  notes: string | null;
  since: string | null;
  created_at: string | null;
  last_login: string | null;
  // Enriched from the profiles table (joined server-side in /api/clients)
  avatar_url?: string | null;
  nickname?: string | null;
  birthday?: string | null;
  // Onboarding (joined server-side in /api/clients)
  onboarding_completed_at?: string | null;
  onboarding_steps_done?: number | null;
}

export function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

export function durationFrom(createdAt?: string): string {
  if (!createdAt) return 'Just started';
  const start = new Date(createdAt);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months <= 0) return 'Just started';
  return months === 1 ? '1 month' : `${months} months`;
}

// New clients get this many days before a missing login counts against them.
const LOGIN_GRACE_DAYS = 7;

// Whole days since an ISO timestamp; null if never / unparseable.
export function daysSinceLogin(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

// True while a never-logged-in client is still within their onboarding grace window.
function inLoginGrace(lastLogin?: string | null, createdAt?: string | null): boolean {
  if (lastLogin) return false; // they've logged in — grace no longer relevant
  const age = daysSinceLogin(createdAt);
  return age !== null && age < LOGIN_GRACE_DAYS;
}

export function formatLastLogin(iso?: string | null, createdAt?: string | null): string {
  const d = daysSinceLogin(iso);
  if (d === null) return inLoginGrace(iso, createdAt) ? 'Awaiting first login' : 'Never';
  if (d <= 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// Real health score (0–100) from login recency + payment status.
// Messaging was removed, so the old "message read" component is gone.
// New clients get full login credit during their grace window so they don't
// show "At risk" before they've had a chance to log in.
export function healthScore(
  lastLogin: string | null | undefined,
  payment: PaymentStatus,
  createdAt?: string | null,
): number {
  let score = 0;
  const d = daysSinceLogin(lastLogin);
  if (d !== null) {
    if (d <= 1) score += 50;
    else if (d < 7) score += 35;
    else if (d < 14) score += 15;
  } else if (inLoginGrace(lastLogin, createdAt)) {
    score += 50; // benefit of the doubt during onboarding
  }
  if (payment === 'Paid') score += 50;
  else if (payment === 'Due') score += 25;
  return score;
}

export function mapRow(row: ClientRow): Client {
  const name = row.full_name?.trim() || row.email || 'Unnamed';
  const payment = calcPaymentStatus(row.next_payment_date ?? undefined);
  return {
    id: row.id,
    name,
    initials: getInitials(name),
    since: row.since || '',
    goal: row.goal || '—',
    duration: durationFrom(row.created_at ?? undefined),
    status: (row.status as ClientStatus) || 'Active',
    payment,
    lastLogin: formatLastLogin(row.last_login, row.created_at),
    msgRead: true,
    healthScore: healthScore(row.last_login, payment, row.created_at),
    referrals: 0,
    notes: row.notes || '',
    nextPaymentDate: row.next_payment_date ?? undefined,
    programStart: row.program_start ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    nickname: row.nickname?.trim() || undefined,
    birthday: row.birthday ?? undefined,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    onboardingStepsDone: row.onboarding_steps_done ?? 0,
  };
}

// Shared hook: fetch the authenticated coach's clients from Supabase and map
// them to the frontend Client shape. Used by overview, messages, etc.
export function useClientRoster() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const refetch = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load clients.');
        setClients([]);
      } else {
        setClients((data.clients as ClientRow[]).map(mapRow));
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { clients, loading, error, refetch };
}
