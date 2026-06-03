-- 2026-05-30 — Stripe integration: link clients to their Stripe customer / subscription.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- The Stripe webhook (/api/stripe/webhook) writes the Stripe IDs here so it
-- can later find "which portal client does this invoice / cancellation belong
-- to". The unique index on stripe_subscription_id is what makes the webhook
-- IDEMPOTENT — Stripe retries (which it does aggressively for any non-2xx
-- response, and which it can also send during legitimate at-least-once
-- delivery) can't double-create a client. Safe to re-run.

alter table public.clients
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists clients_stripe_subscription_id_uidx
  on public.clients (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists clients_stripe_customer_id_idx
  on public.clients (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.clients.stripe_customer_id is
  'Stripe customer (cus_…) for this client, populated by the webhook on checkout.session.completed.';
comment on column public.clients.stripe_subscription_id is
  'Stripe subscription (sub_…) for this client''s £185/month plan. The webhook upserts on this — uniqueness here is the idempotency key.';
