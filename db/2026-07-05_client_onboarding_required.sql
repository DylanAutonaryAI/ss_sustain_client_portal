-- Per-client onboarding flag.
-- When true, this client is routed through the onboarding flow until they finish
-- it; when false they land straight on the portal home. Set per-client via the
-- "Show onboarding flow" checkbox in the coach's Add-client modal.
--
-- Default FALSE so every existing / bulk-imported client (moved off Notion) skips
-- onboarding — only clients the coach explicitly ticks will see it. Safe to re-run.
alter table public.clients
  add column if not exists onboarding_required boolean not null default false;

comment on column public.clients.onboarding_required is
  'When true, route this client through the onboarding flow until onboarding_completed_at is set. Set per-client in the Add-client modal. Default false = straight to portal home.';
