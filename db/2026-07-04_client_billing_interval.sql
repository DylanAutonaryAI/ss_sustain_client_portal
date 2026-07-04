-- 2026-07-04 — Per-client billing frequency (monthly / 3 / 6 / 12-month installments)
-- Run this in the Supabase SQL editor (or via scripts/run-migration.mjs).
--
-- Not every client pays monthly — some pay in 3- or 6-month installments. This
-- adds how often each client pays, so:
--   • MRR is normalised: clients.monthly_amount now holds the AMOUNT PER PAYMENT
--     (the installment that hits the bank), and MRR = amount / interval months.
--     A £555 payment every 3 months counts as £185/month. (Monthly clients keep
--     interval 1, so their amount == their monthly figure — nothing changes.)
--   • The roster "Payment received" button rolls next_payment_date forward by the
--     client's interval (1/3/6/12 months), not always one month.
-- Additive + idempotent (default 1 = monthly) so existing rows are unaffected.

alter table public.clients
  add column if not exists billing_interval_months smallint not null default 1;

comment on column public.clients.billing_interval_months is
  'How often the client pays: 1 (monthly), 3, 6, or 12 months. With monthly_amount (amount per payment), MRR = monthly_amount / billing_interval_months.';

comment on column public.clients.monthly_amount is
  'Amount charged PER PAYMENT (the installment). Combined with billing_interval_months to normalise MRR. NULL = fall back to the most recent Paid payment amount.';
