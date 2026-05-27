'use client';

import { useState, useEffect } from 'react';

// ─── Phase / week label helpers ──────────────────────────────────────────────

// Week number derived from the program start date. Week 1 is the first week,
// so a start date of today → "Week 1", and it ticks over every 7 days.
// A future start date clamps to Week 1; a missing/invalid date → null.
export function weekFromStart(programStart?: string | null): number | null {
  if (!programStart) return null;
  const start = new Date(programStart + 'T00:00:00');
  if (isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  if (diffDays < 0) return 1;
  return Math.floor(diffDays / 7) + 1;
}

// Builds the top-bar status label, e.g. "Bulk · Week 8". Falls back gracefully
// when only one piece is known, and returns undefined when neither is set
// (so the Topbar simply hides the pill).
export function phaseWeekLabel(goal?: string | null, programStart?: string | null): string | undefined {
  const phase = goal && goal.trim() && goal.trim() !== '—' ? goal.trim() : null;
  const week = weekFromStart(programStart);
  if (phase && week) return `${phase} · Week ${week}`;
  if (phase) return phase;
  if (week) return `Week ${week}`;
  return undefined;
}

// ─── Hook: the signed-in client's own phase/week ─────────────────────────────

interface MyClient {
  goal: string | null;
  program_start: string | null;
  status: string | null;
}

// Cached at module scope so navigating between portal pages doesn't refetch.
// Logout does a full page navigation (window.location), which clears this.
let cache: MyClient | null = null;
let cachePromise: Promise<MyClient | null> | null = null;

function loadMyClient(): Promise<MyClient | null> {
  if (cachePromise) return cachePromise;
  cachePromise = fetch('/api/clients/me', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      cache = (d?.client as MyClient) ?? null;
      return cache;
    })
    .catch(() => null);
  return cachePromise;
}

export function useMyPhaseWeek(): { statusLabel?: string; loading: boolean } {
  const [data, setData] = useState<MyClient | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let active = true;
    if (cache !== null) { setData(cache); setLoading(false); return; }
    loadMyClient().then(c => {
      if (!active) return;
      setData(c);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { statusLabel: phaseWeekLabel(data?.goal, data?.program_start), loading };
}
