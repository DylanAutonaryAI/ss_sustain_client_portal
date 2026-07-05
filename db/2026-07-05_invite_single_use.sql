-- Invite single-use enforcement.
-- Stamps when a client first accepts their invite (sets their password via
-- /api/set-password). That route now refuses to run the password-set path a
-- second time once this is set, so a still-valid invite access_token (~1h life)
-- can't be replayed to re-run the flow. Nullable; NULL = not yet accepted.
alter table public.clients
  add column if not exists invite_accepted_at timestamptz;

comment on column public.clients.invite_accepted_at is
  'When the client first accepted their invite (set password). Enforces single-use of the invite link in /api/set-password.';
