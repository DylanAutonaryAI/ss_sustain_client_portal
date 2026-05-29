'use client';

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';

// ─── Sidebar "unseen" badges ──────────────────────────────────────────────────
//
// Per-user, server-backed notification ticker. For each sidebar section we
// keep the set of item ids the user has already seen, stored in Supabase
// (`notification_seen` table, one row per user × section_key). Visiting the
// section marks everything in it as seen → badge clears, permanently, across
// every device the user signs in on.
//
// "Start clean" semantics: a section that has never had a row auto-seeds on
// first load to the current item ids, so a brand-new account does NOT show a
// wall of badges. Badges only ever light when a NEW id (not yet in seen_ids)
// appears in that section.

type SeenMap = Record<string, string[]>;
interface SeenState { seen: SeenMap; loaded: boolean }

let state: SeenState = { seen: {}, loaded: false };
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
// Stable empty objects so React doesn't re-render on identity changes during
// SSR / before the initial fetch resolves.
const SERVER_STATE: SeenState = { seen: {}, loaded: false };

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function getSnapshot(): SeenState { return state; }
function getServerSnapshot(): SeenState { return SERVER_STATE; }
function notify() { listeners.forEach((l) => l()); }

function sameSet(a: string[] | undefined, b: string[]): boolean {
  if (!a || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// Fetches the user's seen map ONCE. Idempotent: subsequent calls return the
// in-flight promise (or no-op if already loaded). Any local marks made before
// the fetch resolves win over the server response — so a click during load
// doesn't get clobbered.
function ensureLoaded(): Promise<void> | null {
  if (state.loaded) return null;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    let fetched: SeenMap = {};
    try {
      const res = await fetch('/api/notifications/seen', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.seen && typeof data.seen === 'object') {
          fetched = data.seen as SeenMap;
        }
      }
    } catch { /* ignore — leave state empty, hooks just return 0 */ }
    state = { seen: { ...fetched, ...state.seen }, loaded: true };
    loadingPromise = null;
    notify();
  })();
  return loadingPromise;
}

// Mark a section's current items as seen and persist to the DB. Idempotent —
// a no-op when the in-memory set already matches, so it's safe to call every
// render. The POST is fire-and-forget; if it fails the local cache still
// reflects the click, and the next page load will re-sync from the server.
export function markSeen(key: string, ids: string[]): void {
  if (sameSet(state.seen[key], ids)) return;
  state = { ...state, seen: { ...state.seen, [key]: [...ids] } };
  notify();
  fetch('/api/notifications/seen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, ids }),
    cache: 'no-store',
    keepalive: true,
  }).catch(() => {});
}

export interface UnseenEntry {
  key: string;
  href: string;
  ids: string[] | null; // null = data not loaded yet
}

// Returns { [key]: unseenCount }. Until the seen map has loaded from the
// server, every count is 0 — so we never flash "everything is new" before we
// know what's already been seen. Once loaded, any section that has no row
// yet auto-seeds (markSeen with the current ids), giving "start clean"
// behavior on first login: badges only appear for items added LATER.
export function useUnseenCounts(entries: UnseenEntry[]): Record<string, number> {
  const { seen, loaded } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => { ensureLoaded(); }, []);

  // Trigger auto-seed whenever data loads in or new entries appear. The dep
  // string captures "has the seen map loaded" + "which keys have ids and how
  // many" — enough to fire when an async context resolves. markSeen is
  // idempotent so re-runs are safe.
  const sig = entries
    .map((e) => `${e.key}:${e.ids === null ? 'n' : e.ids.length}`)
    .join('|');
  useEffect(() => {
    if (!loaded) return;
    for (const e of entries) {
      if (!e.ids || e.ids.length === 0) continue;
      if (seen[e.key] === undefined) markSeen(e.key, e.ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, sig]);

  const out: Record<string, number> = {};
  for (const e of entries) {
    if (!loaded || !e.ids) { out[e.key] = 0; continue; }
    const s = seen[e.key];
    // Undefined here means the auto-seed is pending (this render); show 0.
    if (s === undefined) { out[e.key] = 0; continue; }
    const set = new Set(s);
    out[e.key] = e.ids.reduce((n, id) => n + (set.has(id) ? 0 : 1), 0);
  }
  return out;
}

// Marks the section matching the current pathname as seen whenever the route
// (or that section's items) changes. Call once from the sidebar.
export function useMarkActiveSeen(entries: UnseenEntry[], pathname: string): void {
  const active = entries.find(
    (e) => pathname === e.href || pathname.startsWith(e.href + '/'),
  );
  const sig = active ? `${active.key}:${(active.ids ?? []).join(',')}` : '';
  useEffect(() => {
    if (active?.ids) markSeen(active.key, active.ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}
