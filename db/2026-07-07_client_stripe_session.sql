-- 2026-07-07 — Support ONE-OFF Stripe purchases (e.g. "The Shred Code") in the
-- webhook. One-off checkouts have no subscription id, so we key idempotency on
-- the Checkout session id instead. Additive + safe on a live DB.
alter table public.clients
  add column if not exists stripe_session_id text;

-- Idempotency: Stripe retries can't double-create a one-off client.
create unique index if not exists clients_stripe_session_id_key
  on public.clients (stripe_session_id)
  where stripe_session_id is not null;

comment on column public.clients.stripe_session_id is
  'Stripe Checkout session id for ONE-OFF purchases (e.g. The Shred Code). Idempotency key for non-subscription webhook events. NULL for subscription / manual clients.';
