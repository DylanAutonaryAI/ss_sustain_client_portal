-- 2026-05-27 — Real onboarding tracking (per client, server-side)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Until now onboarding completion lived only in the client's browser
-- (localStorage). This makes it real:
--   • onboarding_progress  — one row per (client, step) the client has completed.
--   • clients.onboarding_completed_at — stamped when ALL required steps are done.
--
-- The step list itself lives in code (lib/onboarding.ts); these rows just record
-- which step_key values a client has finished. Safe to run more than once.

-- 1) Completion stamp on the client record (drives the coach roster badge).
alter table public.clients
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.clients.onboarding_completed_at is
  'Set the moment a client finishes every onboarding step. NULL = still onboarding. The coach roster shows this as the "Onboarded ✓" badge.';

-- 2) Per-step progress. step_key matches the stable keys in lib/onboarding.ts.
create table if not exists public.onboarding_progress (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  step_key     text not null,
  completed_at timestamptz not null default now(),
  unique (client_id, step_key)
);

create index if not exists onboarding_progress_client_idx
  on public.onboarding_progress(client_id);

-- 3) RLS on. All reads/writes go through service-role API routes that scope
--    every query to the caller (client by user_id, coach by coach_id), exactly
--    like the rest of the app — so no public policies are needed. With RLS
--    enabled and no policies, direct anon/client access is denied by default.
alter table public.onboarding_progress enable row level security;

-- 4) OPTIONAL — grandfather existing clients. The gate now reads the DB instead
--    of the browser, so anyone already using the portal would otherwise be sent
--    back through onboarding. Uncomment to mark every current client as already
--    onboarded. Leave commented if you'd rather they all complete the new flow.
-- update public.clients
--   set onboarding_completed_at = now()
--   where onboarding_completed_at is null;
