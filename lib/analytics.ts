'use client';

import { useState, useEffect, useCallback } from 'react';

export { TRACKED_SECTIONS } from '@/lib/sections';

export interface SectionStat {
  key: string;
  label: string;
  reach: number;   // distinct clients who have EVER opened this section
  views: number;   // total recorded views (deduped to once/session/section client-side)
  pct: number;     // reach as a % of clients who have ever logged in
  reach30: number; // distinct clients who opened it in the last 30 days
  pct30: number;   // reach30 as a % of clients who have ever logged in
}

export interface AnalyticsData {
  totalClients: number;
  withLogin: number;       // clients who have ever logged in
  neverLoggedIn: number;
  activeToday: number;     // last login within 1 day
  active7d: number;        // last login within 7 days
  active30d: number;       // last login within 30 days
  inactive14plus: number;  // logged in before, but >14 days ago
  activationRate: number;  // withLogin / totalClients, 0–100
  sections: SectionStat[];
  referrals: { totalLeads: number; referrers: number; topName: string | null; topCount: number };
  community: { upcoming: number; attendingTotal: number; nextTitle: string | null; nextDate: string | null };
}

// Shared hook: load the coach's portal analytics (all real, computed server-side).
export function useAnalytics() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const refetch = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to load analytics.'); setData(null); }
      else setData(json as AnalyticsData);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
