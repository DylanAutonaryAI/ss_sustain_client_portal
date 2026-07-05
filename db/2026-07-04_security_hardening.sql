-- 2026-07-04 — Security hardening (safe, non-breaking)
--
-- (1) Lock the SECURITY DEFINER RPCs down to authenticated + service_role only.
--     They were EXECUTE-granted to PUBLIC/anon. The browser only ever calls them
--     as an authenticated user (get_my_role in the server layouts + login;
--     touch_last_login / record_page_view from the signed-in portal), so removing
--     the anon/PUBLIC grant closes surface with zero legitimate impact. We GRANT
--     the explicit roles first so authenticated can never lose access mid-migration.
grant execute on function public.get_my_role()               to authenticated, service_role;
grant execute on function public.record_page_view(p_section text) to authenticated, service_role;
grant execute on function public.touch_last_login()          to authenticated, service_role;
revoke execute on function public.get_my_role()               from public, anon;
revoke execute on function public.record_page_view(p_section text) from public, anon;
revoke execute on function public.touch_last_login()          from public, anon;

-- (2) Referral dedupe: one lead per (referrer, email). Stops the same friend
--     being inserted repeatedly to inflate counts / flood the coach view, and
--     lets /api/referral/submit upsert-on-conflict. Safe now (table is empty).
create unique index if not exists referral_leads_referrer_email_uniq
  on public.referral_leads (referrer_id, lower(email));
