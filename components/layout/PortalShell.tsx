'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ONBOARDING_TEST_MODE } from '@/lib/onboarding';
import ClientSidebar from '@/components/layout/ClientSidebar';
import ChatWidget from '@/components/assistant/ChatWidget';

// Sections whose record_page_view call is currently in flight, so a StrictMode
// double-mount / rapid re-render can't fire duplicate calls for the same one.
// Module-level so it survives re-renders; resets on a full page reload.
const pageViewInFlight = new Set<string>();

// Client shell for the portal. Auth + role are enforced server-side in
// app/portal/layout.tsx (a server component that redirects before this renders);
// this handles the client-only concerns: the onboarding gate, activity stamping,
// and per-section view tracking.
export default function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Hold portal content until the onboarding gate is checked, so an un-onboarded
  // client never briefly sees the portal before being redirected.
  const [gateChecked, setGateChecked] = useState(false);

  // Coaches don't belong in the portal — bounce to their dashboard. The server
  // layout already redirects the wrong role on a hard load; this also covers a
  // client-side role change without a full reload.
  useEffect(() => {
    if (user?.role === 'coach') router.push('/coach/overview');
  }, [user, router]);

  // Onboarding gate — authoritative, from Supabase. A client must finish every
  // step before portal content unlocks. Runs ONCE on mount so a refreshing
  // session / changing `user` can't cancel it mid-flight, and always resolves
  // gateChecked (fails open) so a transient error can never trap the portal.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/onboarding/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        // Only gate real clients; coaches / accounts without a client row pass through.
        const isClient = !!data?.isClient;
        // TESTING MODE (ONBOARDING_TEST_MODE, or local dev): always send the client
        // through onboarding on every login UNLESS they've hit the admin skip for
        // this session. At go-live (flag off): gate only until they've completed it.
        const testMode = ONBOARDING_TEST_MODE || process.env.NODE_ENV === 'development';
        const skipped = testMode && sessionStorage.getItem('ss-dev-skip');
        const needsOnboarding = isClient && (testMode ? !skipped : !data?.completedAt);
        if (needsOnboarding) router.push('/onboarding');
        else setGateChecked(true);
      })
      .catch(() => { if (!cancelled) setGateChecked(true); }); // fail open on a network blip
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stamp the client's last activity once per browser session (no-op for coaches).
  useEffect(() => {
    if (sessionStorage.getItem('ss-activity-stamped')) return;
    createClient().rpc('touch_last_login')
      .then(
        () => sessionStorage.setItem('ss-activity-stamped', '1'),
        () => {},
      );
  }, []);

  // Record which section the client opens, once per section per browser session.
  // The persistent flag is set only AFTER the call succeeds, so a failed/blocked
  // call (e.g. a network blip) doesn't permanently suppress recording — it just
  // retries on the next navigation. The in-flight set stops StrictMode
  // double-mounts from double-counting. No-op for coaches (record_page_view
  // ignores callers without a clients row). Powers the Analytics section chart.
  useEffect(() => {
    const section = (pathname || '').replace(/^\/portal\/?/, '').split('/')[0] || 'home';
    const key = `ss-pv-${section}`;
    if (sessionStorage.getItem(key) || pageViewInFlight.has(section)) return;
    pageViewInFlight.add(section);
    createClient().rpc('record_page_view', { p_section: section }).then(
      () => { sessionStorage.setItem(key, '1'); pageViewInFlight.delete(section); },
      () => { pageViewInFlight.delete(section); },
    );
  }, [pathname]);

  // Hold portal content until BOTH the onboarding gate is checked AND the auth
  // profile has loaded — so the name/greeting never flashes "there" on a hard
  // reload (auth resolves a beat after the page first paints).
  if (!gateChecked || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <ClientSidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: '220px' }}>
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
