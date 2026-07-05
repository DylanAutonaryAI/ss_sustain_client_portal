-- 2026-07-04 — SECURITY: add the missing coach role-check to the clients policy
--
-- The "Coach can manage their clients" ALL policy was USING (coach_id = auth.uid())
-- granted to PUBLIC with no role check — so any authenticated user (not just a
-- coach) could INSERT/UPDATE/DELETE clients rows where coach_id = their own uid.
-- This brings it in line with the other coach-write policies (announcements,
-- community_events) which already require get_my_role() = 'coach'.
--
-- SAFE: the coach roster routes query clients as the authenticated coach, who
-- satisfies coach_id = auth.uid() AND get_my_role() = 'coach'; a client calling
-- the same route is simply denied (they were never meant to). The separate
-- "Client can read own record" SELECT policy (user_id = auth.uid()) is untouched.

drop policy if exists "Coach can manage their clients" on public.clients;
create policy "Coach can manage their clients" on public.clients
  for all to authenticated
  using (coach_id = auth.uid() and get_my_role() = 'coach')
  with check (coach_id = auth.uid() and get_my_role() = 'coach');
