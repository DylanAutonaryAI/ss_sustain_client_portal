-- 2026-05-28 — Social / meal tracker (per-client, coach-visible)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Sam's off-plan meal + night-out tracker, rebuilt into the portal. Each client
-- has a one-time setup (calorie target / goal / activity) and logs off-plan meals
-- and nights out. Weekly totals are computed from logged_on dates, so "this week"
-- is always live. The coach reads each client's tracker from their roster.
--
-- All access is via the service-role API routes (RLS locked, no public policies),
-- same pattern as page_views / referral_leads. Safe to re-run (IF NOT EXISTS).

-- ── per-client setup ─────────────────────────────────────────────────────────
create table if not exists public.tracker_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  coach_id   uuid not null references auth.users(id) on delete cascade,
  calories   integer not null,                  -- daily calorie target
  goal       text not null default 'Fat loss',  -- 'Fat loss' | 'Maintenance'
  steps      integer,                            -- avg daily steps (4000/6500/10000/14000)
  sessions   integer,                            -- weekly training sessions (0–6)
  updated_at timestamptz not null default now()
);

comment on table public.tracker_profiles is
  'Per-client setup for the off-plan meal/night-out tracker (daily calorie target, goal, activity). One row per client.';

-- ── off-plan meals + nights out ──────────────────────────────────────────────
create table if not exists public.tracker_logs (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  coach_id     uuid not null references auth.users(id) on delete cascade,
  label        text not null,                    -- e.g. "🍔 McDonald's – Big Mac" / "🍺 Night out (2x Pint…)"
  cal          integer not null,
  notes        text,
  is_night_out boolean not null default false,
  logged_on    date not null default current_date,
  created_at   timestamptz not null default now()
);

comment on table public.tracker_logs is
  'Each off-plan meal or night out a client logs. Weekly stats are summed over logged_on within the current week. Powers the client dashboard and the coach''s per-client view.';

create index if not exists tracker_logs_user_idx  on public.tracker_logs (user_id, logged_on desc);
create index if not exists tracker_logs_coach_idx on public.tracker_logs (coach_id, logged_on desc);

-- ── RLS: locked; all reads/writes go through the service-role API routes ──────
alter table public.tracker_profiles enable row level security;
alter table public.tracker_logs     enable row level security;
-- No policies on purpose — the API routes use the service-role key and scope
-- every query to the caller's own user_id (client) or coach_id (coach).
