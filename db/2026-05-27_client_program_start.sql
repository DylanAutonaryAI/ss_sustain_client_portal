-- 2026-05-27 — Per-client phase/week for the portal top-bar
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- The top-bar shows "<phase> · Week N":
--   • phase  = the existing clients.goal column (Bulk / Fat loss / ...). No change needed.
--   • week   = auto-counted from program_start, which Sam sets per client in the roster.
--
-- Adds one nullable date column. Safe to run more than once (IF NOT EXISTS).

alter table public.clients
  add column if not exists program_start date;

comment on column public.clients.program_start is
  'Date the client''s current program/phase began. The portal top-bar derives the week number from this (week = full weeks since this date + 1). Set by the coach in the roster.';

-- OPTIONAL backfill: seed existing clients'' start date from when their record
-- was created, so they immediately show a week instead of just the phase.
-- Comment out if you would rather set each one by hand.
update public.clients
  set program_start = created_at::date
  where program_start is null;
