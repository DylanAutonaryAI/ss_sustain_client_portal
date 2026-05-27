-- 2026-05-27 — Referral scheme (tracking + £100 payout reminders)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Scheme (Sam): £100 to the REFERRER per person who joins the team.
--   • Monthly signup        → paid after 3 months (held until then; churn = no payout).
--   • Upfront 3/6/12-month  → paid immediately.
--   • The new client gets nothing (v1).
--
-- The portal NEVER moves money or touches Stripe — it's the source of truth +
-- reminder. Sam converts a lead (picks the plan), the portal computes when the
-- £100 is due, and Sam ticks it "paid" once he's sent the bank transfer.
--
-- All access is via the service-role API routes, so RLS is locked (no policies),
-- same pattern as page_views. Safe to run more than once (IF NOT EXISTS).

-- ── each client gets a unique referral code (drives /join?ref=CODE) ───────────
alter table public.clients
  add column if not exists referral_code text;

-- Unique, but allow many NULLs (codes are generated lazily on first use).
create unique index if not exists clients_referral_code_key
  on public.clients (referral_code)
  where referral_code is not null;

-- ── leads captured via a referral link, plus their conversion + payout state ──
create table if not exists public.referral_leads (
  id                  bigint generated always as identity primary key,
  referrer_id         uuid not null references public.clients(id) on delete cascade,
  name                text not null,
  email               text not null,
  status              text not null default 'pending',  -- 'pending' | 'converted'
  created_at          timestamptz not null default now(),
  -- set when Sam converts the lead (they became a paying client):
  converted_client_id uuid references public.clients(id) on delete set null,
  plan_type           text,        -- 'upfront' | 'monthly'
  joined_at           date,        -- when they started paying (the payout clock)
  payout_due_at       date,        -- upfront → joined_at; monthly → joined_at + 3 months
  payout_paid_at      timestamptz  -- when Sam recorded the £100 as paid
);

comment on table public.referral_leads is
  'Referral leads from /join?ref=CODE. status converts pending→converted when the person becomes a paying client; payout_due_at encodes Sam''s £100 timing (immediate for upfront plans, +3 months for monthly).';

create index if not exists referral_leads_referrer_idx on public.referral_leads (referrer_id);
create index if not exists referral_leads_payout_idx   on public.referral_leads (payout_due_at) where status = 'converted' and payout_paid_at is null;

alter table public.referral_leads enable row level security;
-- No policies: every read/write goes through the service-role API routes, which
-- scope each query to the caller's own clients (mirrors page_views / leaderboard).
