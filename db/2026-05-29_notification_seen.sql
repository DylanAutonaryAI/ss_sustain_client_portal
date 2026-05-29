-- 2026-05-29 — Sidebar notification "seen" state, per-user, server-side.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Replaces the per-browser localStorage (`ss-seen-v1`) so that sidebar badges:
--   • stay cleared across logout / refresh / different machines, and
--   • only re-light when a genuinely NEW item (id not yet in seen_ids) appears.
--
-- Semantics (matches lib/notifications.ts):
--   badge(section) = #items currently in that section whose id is NOT in
--   notification_seen.seen_ids for (user_id, section_key).
-- A section that has no row yet auto-seeds on first load to the current item
-- ids — so a new account starts CLEAN (no wall of badges on first login).
--
-- All access is via the service-role API route (RLS locked, no policies),
-- same pattern as page_views / referral_leads / tracker_*. Safe to re-run.

create table if not exists public.notification_seen (
  user_id     uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  seen_ids    text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  primary key (user_id, section_key)
);

comment on table public.notification_seen is
  'Per-user "seen item ids" for each sidebar notification section. Service-role API only.';

create index if not exists notification_seen_user_idx
  on public.notification_seen (user_id);

alter table public.notification_seen enable row level security;
-- No policies on purpose — the API route uses the service-role key and scopes
-- every query to the caller's own user_id.
