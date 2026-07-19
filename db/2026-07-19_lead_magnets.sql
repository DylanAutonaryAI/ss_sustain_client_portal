-- 2026-07-19 — Lead Magnets (website lead-magnet signups, coach-only)
-- Run: node scripts/run-migration.mjs db/2026-07-19_lead_magnets.sql
--
-- The website lead-magnet form ("Send Me The Free Series") POSTs each signup to
-- /api/webhooks/lead-magnet; this table stores them and the coach-only Lead
-- Magnets page reads them. `raw` keeps the EXACT webhook payload so we can see
-- any extra fields the form sends and tighten the parser after the first test.
--
-- Public insert is via the service-role webhook route (rate-limited + optional
-- shared secret); coach reads via the service role behind a role check. Only the
-- coach ever sees this — clients have no route to it.
--
-- RLS locked, no policies — same pattern as referral_leads. Safe to re-run.

create table if not exists public.lead_magnet_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  source      text,                         -- which magnet/page, if the form sends it
  raw         jsonb,                         -- full webhook payload (debugging / extra fields)
  archived_at timestamptz,                   -- coach can archive handled leads
  created_at  timestamptz not null default now()
);

comment on table public.lead_magnet_leads is
  'Website lead-magnet signups (name + email) received via /api/webhooks/lead-magnet. Coach-only. raw = full webhook payload for inspection.';

create index if not exists lead_magnet_leads_created_idx on public.lead_magnet_leads (created_at desc);

alter table public.lead_magnet_leads enable row level security;
-- No policies — all access via the service-role API routes.
