'use client';

import { useEffect, useSyncExternalStore } from 'react';

// ─── Sidebar "unseen" badges ──────────────────────────────────────────────────
//
// A lightweight, client-side notification ticker. For each sidebar section we
// keep the set of item ids the user has already seen (in localStorage). The
// badge number = items currently in that section whose id is NOT yet seen.
// Visiting the section marks everything in it as seen → the badge clears.
//
// No server/DB work: it's purely "what's new since you last opened this tab",
// per browser. Coach churn uses the same mechanism (the "items" are the
// at-risk client ids), so a newly at-risk client lights the badge until viewed.

type SeenMap = Record<string, string[]>; // section key → seen item ids
const STORAGE_KEY = 'ss-seen-v1';

function load(): SeenMap {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as SeenMap; }
  catch { return {}; }
}

let seen: SeenMap = load();
const listeners = new Set<() => void>();
const EMPTY: SeenMap = {};

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function getSnapshot(): SeenMap { return seen; }
function getServerSnapshot(): SeenMap { return EMPTY; }

function sameSet(a: string[] | undefined, b: string[]): boolean {
  if (!a || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// Mark a section's current items as seen (clears its badge). Idempotent — a
// no-op when the seen set already matches, so it's safe to call every render.
export function markSeen(key: string, ids: string[]): void {
  if (sameSet(seen[key], ids)) return;
  seen = { ...seen, [key]: [...ids] };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seen)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export interface UnseenEntry {
  key: string;
  href: string;
  ids: string[] | null; // null = data not loaded yet
}

// Returns { [key]: unseenCount }. A section never opened (no seen record) counts
// everything currently in it as new; after the first visit, only ids added since
// then count. Always 0 until the component has mounted on the client (avoids an
// SSR/hydration mismatch — gate badge rendering on a mounted flag too).
export function useUnseenCounts(entries: UnseenEntry[]): Record<string, number> {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (!e.ids) { out[e.key] = 0; continue; }
    const s = snap[e.key];
    if (s === undefined) { out[e.key] = e.ids.length; continue; }
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
