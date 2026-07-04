-- 2026-07-04 — Per-client monthly rate (for non-Stripe / bank-transfer clients)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Existing clients pay outside Stripe (bank transfer). This stores each client's
-- agreed monthly rate so:
--   • MRR reflects the contracted recurring revenue immediately (no need to log a
--     payment first) — lib/payments.ts computeMrr sums this for Active clients,
--     falling back to their most-recent Paid ledger amount when it's null.
--   • The roster's one-click "Payment received" button knows how much to log and
--     rolls next_payment_date forward a month (app/api/clients/mark-paid).
-- The Stripe webhook also sets this from the subscription price so MRR is uniform
-- across Stripe and manually-tracked clients.
--
-- Nullable — a client with no rate set simply contributes their last Paid amount
-- (or £0) to MRR, exactly as before. Safe to re-run.

alter table public.clients
  add column if not exists monthly_amount numeric;

comment on column public.clients.monthly_amount is
  'Agreed monthly rate (GBP). Drives MRR and the roster "Payment received" quick-log. NULL = fall back to the most recent Paid payment amount.';
