-- 2026-05-27 — Portal section view tracking (powers the coach Analytics page)
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Records which portal sections each CLIENT opens, so the coach can see real
-- engagement ("most visited sections", reach per section) instead of mock data.
--
-- Design mirrors touch_last_login: clients never insert directly. They call the
-- SECURITY DEFINER rpc record_page_view(section), which stamps user_id + their
-- coach_id server-side. Coaches read aggregates via the service-role API route.
-- Safe to run more than once (IF NOT EXISTS / OR REPLACE).

-- ── table ───────────────────────────────────────────────────────────────────
create table if not exists public.page_views (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  coach_id  uuid not null references auth.users(id) on delete cascade,
  section   text not null,
  viewed_at timestamptz not null default now()
);

comment on table public.page_views is
  'One row per client portal section view (deduped to once per browser session per section by the client). Powers the coach Analytics page.';

create index if not exists page_views_coach_idx        on public.page_views (coach_id, viewed_at desc);
create index if not exists page_views_coach_section_idx on public.page_views (coach_id, section);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Inserts only ever happen through the SECURITY DEFINER rpc below (which runs as
-- the function owner and bypasses RLS), so no INSERT policy is needed — and its
-- absence means clients cannot forge rows by writing the table directly.
alter table public.page_views enable row level security;

-- A client may read their own view history (nice-to-have; the coach Analytics
-- route reads aggregates with the service-role key, not this policy).
drop policy if exists "own page views readable" on public.page_views;
create policy "own page views readable"
  on public.page_views for select
  using (user_id = auth.uid());

-- ── rpc: record a section view ───────────────────────────────────────────────
create or replace function public.record_page_view(p_section text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid;
begin
  if p_section is null or length(trim(p_section)) = 0 then
    return;
  end if;

  -- Only clients generate view events; resolve the caller's coach. Coaches and
  -- unlinked users have no clients row, so they silently record nothing.
  select coach_id into v_coach
  from public.clients
  where user_id = auth.uid()
  limit 1;

  if v_coach is null then
    return;
  end if;

  insert into public.page_views (user_id, coach_id, section)
  values (auth.uid(), v_coach, lower(trim(p_section)));
end;
$$;

grant execute on function public.record_page_view(text) to authenticated;
