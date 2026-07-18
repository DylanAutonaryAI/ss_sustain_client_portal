-- 2026-07-18 — Client Clips (client-submitted form-check videos, coach-visible)
-- Run in the Supabase SQL editor, or via: node scripts/run-migration.mjs db/2026-07-18_client_clips.sql
--
-- Clients film a set on their phone and upload it straight to Cloudflare Stream
-- (which transcodes it so it plays on any device / codec, incl. iPhone HEVC).
-- Only the client's own coach can watch it back, per client, on their check-in.
-- The VIDEO lives in Cloudflare, not Postgres — this table is just the metadata:
-- the Cloudflare video id (stream_uid), processing status, and review state.
-- Auto-pruned after ~6 weeks (Cloudflare scheduledDeletion + a created_at filter
-- in the API), matching "review on check-in, then done".
--
-- SEPARATE BY DESIGN from `trainingVideos` (Sam's reference demos, stored in the
-- content JSON, coach→client). This is client→coach: different store, different
-- screen, different direction. They never share a table or a route.
--
-- All access via the service-role API routes (RLS locked, no public policies) —
-- same pattern as tracker_logs / page_views. Safe to re-run (IF NOT EXISTS).

create table if not exists public.client_clips (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id)  on delete cascade,  -- roster row
  user_id          uuid not null references auth.users(id)      on delete cascade,  -- the client's login (uploader)
  coach_id         uuid not null references auth.users(id)      on delete cascade,  -- who may review it
  stream_uid       text,                                  -- Cloudflare Stream video UID
  status           text not null default 'uploading',     -- uploading | processing | ready | error
  label            text,                                  -- optional: exercise name the client typed
  muscle           text,                                  -- optional: muscle group (Chest, Back, …)
  duration_seconds numeric,                               -- filled once Cloudflare finishes processing
  thumbnail_url    text,
  bytes            bigint,
  reviewed_at      timestamptz,                           -- set when the coach marks it reviewed (drives the badge)
  created_at       timestamptz not null default now()
);

comment on table public.client_clips is
  'Client-submitted form-check clips. The video lives in Cloudflare Stream (stream_uid); this row is metadata + review state. Client uploads, only their coach reviews. Auto-pruned ~6 weeks. Distinct from trainingVideos (Sam''s reference demos, coach->client).';

create index if not exists client_clips_coach_idx  on public.client_clips (coach_id,  created_at desc);
create index if not exists client_clips_user_idx   on public.client_clips (user_id,   created_at desc);
create index if not exists client_clips_client_idx on public.client_clips (client_id, created_at desc);
create index if not exists client_clips_uid_idx    on public.client_clips (stream_uid);

alter table public.client_clips enable row level security;
-- No policies on purpose — the API routes use the service-role key and scope every
-- query to the caller's own user_id (client) or coach_id (coach).
