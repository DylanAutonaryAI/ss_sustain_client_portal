-- 2026-05-30 — Pending vs granted portal access.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Adds `clients.access_granted_at`. NULL = client exists in the roster but has
-- NOT been sent a portal invite yet — used by the Stripe purchase flow (creates
-- a pending row) and the coach's manual "Add as pending" toggle. The coach
-- presses "Grant access & send invite" in the roster, which calls
-- /api/clients/grant-access — that's the only path that fires the Supabase
-- invite email + sets this column.
--
-- Backfill: every existing client already has access today (Sam added them
-- with the immediate-invite flow), so we stamp access_granted_at = created_at
-- for any row that's missing it. Safe to re-run.

alter table public.clients
  add column if not exists access_granted_at timestamptz;

update public.clients
   set access_granted_at = coalesce(access_granted_at, created_at, now())
 where access_granted_at is null;

comment on column public.clients.access_granted_at is
  'When the coach sent the portal invite for this client. NULL = pending (paid via Stripe or manually added, but Brevo onboarding not done yet). Stamped by /api/clients/grant-access; never set automatically by the Stripe webhook.';
