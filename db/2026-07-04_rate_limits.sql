-- 2026-07-04 — Rate-limit counters (fixed-window) for abuse protection.
-- Backs lib/rate-limit.ts (assistant denial-of-wallet, referral/reset spam).
-- RLS locked; only the service-role API routes touch it. Safe/idempotent.
create table if not exists public.rate_limits (
  bucket       text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
-- No policies on purpose: written only via the service-role helper.
