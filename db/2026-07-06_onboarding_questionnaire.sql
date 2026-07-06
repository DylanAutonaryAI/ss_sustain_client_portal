-- 2026-07-06 — Onboarding rebuild: intake questionnaire + welcome-pack signature.
--
-- Both are captured during the (per-client) onboarding flow and reviewed by the
-- coach on the roster. Only reached by clients with onboarding_required = true —
-- existing/imported clients (all false) never hit any of this, so this migration
-- is additive and safe on a live DB.

-- Per-client questionnaire answers (one row per client, whole form as JSON so
-- questions can evolve without a schema change). Coach reads it via a service-role
-- route, same pattern as onboarding_progress.
create table if not exists public.onboarding_questionnaire (
  client_id    uuid primary key references public.clients(id) on delete cascade,
  answers      jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.onboarding_questionnaire enable row level security;
-- No public policies on purpose: all access is through the service-role admin
-- client in the API routes (mirrors onboarding_progress / tracker_logs).

-- Welcome-pack e-signature: who signed and when. The pack itself is a static PDF
-- served from /assets; this records the client's acceptance.
alter table public.clients
  add column if not exists welcome_pack_signed_at   timestamptz,
  add column if not exists welcome_pack_signed_name text;

comment on table public.onboarding_questionnaire is
  'Client intake questionnaire answers captured in the onboarding flow. Coach-reviewed on the roster. Service-role access only.';
comment on column public.clients.welcome_pack_signed_at is
  'When the client signed the welcome pack in onboarding (NULL = not signed).';
comment on column public.clients.welcome_pack_signed_name is
  'The name the client typed to sign the welcome pack.';
