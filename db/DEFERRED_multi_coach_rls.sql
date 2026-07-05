-- ⚠️ DEFERRED — DO NOT RUN until a SECOND coach is about to be added, and TEST
-- on a staging/preview first. Deliberately NOT applied during the 2026-07-04
-- security pass because it rewrites LOAD-BEARING read policies on a live app, and
-- the gap it closes is LATENT: today there is exactly one coach, so every
-- `USING (true)` SELECT policy exposes only that coach's content to that coach's
-- own clients — which is the intended behaviour. It becomes a cross-tenant read
-- the moment a second coach exists.
--
-- WHAT IT DOES: replaces the permissive `USING (true)` SELECT policies on the
-- content, community, and rsvp tables with per-coach scoping — a coach reads
-- their own rows; a client reads only their inviting coach's rows. The app's API
-- routes already filter by coach_id, so once verified this changes nothing for
-- legitimate use; it only blocks direct cross-coach PostgREST reads.
--
-- BEFORE RUNNING: confirm each listed table actually has a coach_id column, and
-- smoke-test that a client can still load content + community and a coach still
-- sees their own, on a preview deploy.

do $$
declare t text;
  -- coach reads own; client reads their inviting coach's.
  scope text := '(coach_id = auth.uid() or coach_id in (select coach_id from public.clients where user_id = auth.uid()))';
begin
  foreach t in array array[
    'announcements','webinars','supplements','mindset_tips','gym_bag','shopping_items',
    'non_negotiables','pdf_resources','posing_tips','posing_videos','training_videos',
    'coach_messages','community_events','event_rsvps'
  ] loop
    -- Drop the permissive read policy names actually present on these tables.
    execute format('drop policy if exists %I on public.%I', 'read ' || replace(t,'_',' '), t);
    execute format('drop policy if exists %I on public.%I', 'read events', t);       -- community_events
    execute format('drop policy if exists %I on public.%I', 'read rsvps', t);        -- event_rsvps
    execute format('drop policy if exists %I on public.%I', 'read announcements', t);
    -- Create the scoped read policy.
    execute format(
      'create policy %I on public.%I for select to authenticated using %s',
      'read scoped ' || t, t, scope
    );
  end loop;
end $$;
