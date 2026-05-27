-- 2026-05-27 — Client status reasons (why a client was paused or cancelled)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- The roster can now set a client's status to Active / Paused / Cancelled and
-- record WHY. Two nullable columns store the reason:
--   • status_reason — a preset reason (e.g. "Stopped paying"); analysable later.
--   • status_note   — an optional free-text note for nuance.
-- "Cancelled" = no longer a paying client (left the community / stopped paying).
-- Safe to run more than once.

alter table public.clients
  add column if not exists status_reason text;

alter table public.clients
  add column if not exists status_note text;

comment on column public.clients.status_reason is
  'Preset reason a client was paused/cancelled (e.g. Stopped paying, Went solo). NULL while Active.';
comment on column public.clients.status_note is
  'Optional free-text note expanding on status_reason. NULL while Active.';

-- NOTE: clients.status is a plain text column, so "Cancelled" is a valid value
-- with no further change needed. IF saving a Cancelled client ever errors with a
-- check-constraint violation, your status column has a CHECK limiting it to
-- ('Active','Paused') — find it in the Table editor and drop it, e.g.:
--   alter table public.clients drop constraint clients_status_check;
