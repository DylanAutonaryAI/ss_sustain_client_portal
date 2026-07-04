-- 2026-07-04 — SECURITY: close the profiles self-promotion privilege escalation
--
-- The "Users can update own profile" RLS policy is USING (auth.uid() = id) with a
-- NULL WITH CHECK and no column restriction, and `authenticated`/`anon` held an
-- UPDATE grant on profiles (incl. the role column). So any signed-in client could
-- PATCH /rest/v1/profiles?id=eq.<own-uid> {"role":"coach"} with the public key and
-- promote themselves to coach.
--
-- Fix: REVOKE the client-facing UPDATE grant on profiles. The app never updates
-- profiles from the browser — every profile write (email/avatar/details) goes
-- through a service-role server route (createAdminClient), which is unaffected by
-- this revoke. So this closes the escalation with zero impact on legitimate use.
-- Reversible: GRANT UPDATE ON public.profiles TO authenticated; if ever needed.

revoke update on public.profiles from authenticated, anon;
