# Handoff — live working state

> **Purpose:** the single source of truth for *what is being worked on right now*,
> shared across machines (laptop ↔ computer) through git. Chat history does NOT
> sync between machines — this file is how context is carried.
>
> **Rules for Claude:**
> - **Read this at the START of every session.**
> - **Update it at the END of every session, before pushing.**
> - The **Active** section is the live state — **overwrite it to match reality.**
>   When a task is finished, MOVE it from Active into Recently done, and set
>   Active to whatever is now in progress (or "Nothing in progress" if idle).
> - Do **not** leave a finished task sitting in Active. Stale = bad.
> - Keep entries tight: what / decision / where it lives in the code / what's left.

---

## 📌 Latest handoff note (2026-05-30) — pending-access flow built
**Foundation for the Stripe purchase → portal flow is in.** Decision (with Dylan): the
portal does NOT try to enforce the trust-y onboarding steps (welcome pack signing etc.) —
Sam's existing **Brevo flow stays the gatekeeper**, and the coach unlocks portal access
with one click when the Brevo step is done. Built this session: pending state on
`clients` (`access_granted_at` nullable), `/api/clients/grant-access` route, "Pending
access" pill + dedicated stat card + **Grant access & send invite** button on each
pending row, and an **Add as pending** checkbox on the Add-client modal so Sam can
manually create a pending client (Stripe will hit the same code path later via
`/api/invite-client` with `pending: true`). **Run `db/2026-05-30_client_access.sql`**
before this works in prod — until then, every existing client will look pending in the
roster because the column doesn't exist yet.

⚠️ **Carry-forward before go-live (see Watch out):**
1. **Run `db/2026-05-30_client_access.sql`** (this session's migration — see Active).
2. **Stripe webhook** — still to build. Hits `POST /api/invite-client` with
   `pending: true` + the customer's email / name / plan-derived goal. Once wired up,
   purchase on the landing page → pending row appears in the roster automatically.
3. **Flip `ONBOARDING_TEST_MODE` → false** (`lib/onboarding.ts`) + remove the admin skip
   button — last-minute, do at go-live.
4. **Sam's 2 Loom videos** (welcome + portal walkthrough) — the only thing blocking
   onboarding go-live.
5. **Confirm refresh-token health under the new keys** — the "there" fix populates the
   profile from the server reliably, but if `grant_type=refresh_token` is genuinely broken
   (vs a stranded pre-migration session), browser sessions still can't auto-extend past the
   access-token lifetime (~1h). A clean sign-out → sign-in + a Network check on
   `POST /auth/v1/token?grant_type=refresh_token` (should be 2xx) confirms it.

Deploys go to **`main`** (we push `master:main`). Workflow: `git pull` at start → work in
ONE place → "update the handoff and push" at end. (Setup in `CLAUDE.md`.)

---

## 🔴 Active — pending SQL only
**Pending-access flow (built; gated on running ONE migration).**
- Goal: when a Stripe purchase lands or Sam manually adds a new client, they appear in
  the roster as **pending** — NO invite email is sent. Sam runs his Brevo onboarding
  outside the portal (Calendly call, signed-and-dated welcome pack); when done, he
  presses **"Grant access & send invite"** on their row, which fires the Supabase
  invite. The portal does NOT try to enforce trust-y self-attestation; Brevo + Sam's
  click are the gate.
- **DB:** `db/2026-05-30_client_access.sql` — adds `clients.access_granted_at
  timestamptz` (NULL = pending) and backfills every existing row to `created_at` so
  the current roster doesn't suddenly show as pending. **⚠️ NOT YET RUN IN SUPABASE.**
- **Routes:**
  - `POST /api/invite-client` — now accepts `{ pending: true }`. When true, skips
    `inviteUserByEmail` entirely and inserts a `clients` row with `user_id: null`,
    `access_granted_at: null`. Default behavior (no `pending` flag) is unchanged.
  - `POST /api/clients/grant-access` — new route. Body `{ id }`. Sends the invite
    email and stamps `access_granted_at = now()`. Idempotent (won't double-email
    a click). Handles the "user already exists in auth" edge case by looking the
    existing user up by email.
- **Lib:** `lib/clients.ts` derives `pending = !access_granted_at` on each row and
  overrides health/lastLogin for pending clients so they don't tank the churn
  metrics before they can even log in.
- **UI (`app/coach/clients/page.tsx`):**
  - Stat row is now 5 cards (added **Pending access**, amber when > 0).
  - Status column shows a yellow **"Pending access"** pill instead of the
    Active/Paused/Cancelled pill while pending.
  - Expanded row has a full-width amber banner with a primary **"Grant access &
    send invite"** button — appears only for pending clients.
  - Add-client modal has an **"Add as pending — no invite yet"** checkbox (amber
    background when checked). Button label changes to "Add as pending" / "Adding…"
    when set.
- **Stripe webhook (NOT built yet):** the design is to call `/api/invite-client` with
  `pending: true` + `{ email, full_name, goal, status }` derived from the
  `checkout.session.completed` payload. Plan/payment details + the webhook signature
  verification are a follow-up.
- Smoke-test after the SQL: add a client with "Add as pending" → see it as Pending
  access in the roster → open the row → press **Grant access** → invite email arrives
  → they can set their password and sign in → pill flips to Active.

---

### Also live, awaiting Sam — Onboarding flow (Gate 2 only)
**Onboarding flow → made real. Engine built; going-live is gated on 2 things.**
- Was a front-end shell (localStorage only, no coach visibility, skippable,
  duplicate-id bug). Now Supabase-backed:
  - `db/2026-05-27_onboarding_progress.sql` — new `onboarding_progress` table +
    `clients.onboarding_completed_at`.
  - `lib/onboarding.ts` — canonical steps, stable keys (replaces the deleted
    `lib/mock-data/onboarding.ts`); steps needing real content flagged `placeholder`.
  - `app/api/onboarding/me/route.ts` — GET progress / POST mark-step + stamp completion.
  - `app/onboarding/page.tsx` — wired to the API; videos **embed inline** (Loom
    share URL → embed via `loomEmbedUrl`); community step shows the **team photo**
    (`/images/team.JPG`, via new `OnboardingStep.image`). **DEV testing mode**: in
    `NODE_ENV==='development'` the gate always routes a client to onboarding (ignores
    `completedAt`) with a **bypass button** (`ss-dev-skip` session flag, cleared on
    logout); **prod has no skip** and gates only until completed. All dev-only bits are
    stripped from the prod build.
  - `app/portal/layout.tsx` — gate now reads the DB, not the browser.
  - `app/coach/clients/page.tsx` — roster shows onboarding status (Not started /
    N of M / Onboarded ✓ + date). Sam's in-portal proof.
- **GATE 1 — `db/2026-05-27_onboarding_progress.sql` applied ✅** (verified by query;
  table + `onboarding_completed_at` column live). Onboarding gate is enforced in prod.
- **DECISION (2026-05-27): portal onboarding COMPLEMENTS Sam's Brevo flow, doesn't
  replace it.** Sam's real onboarding runs outside the portal — Jotform application →
  Calendly call → **Brevo 2-day** flow (Day 1 info sheet + 1fit/Sheets/Notion invites;
  Day 2 welcome pack sign & date) → per-client **Loom** assessment-week video. By the
  time a client has portal access they've done all that. So the gate is **light** and
  doesn't duplicate Brevo. Final step list (6), confirmed with Dylan:
  1. Welcome video *(placeholder — Sam recording this week)*
  2. How to use your portal *(placeholder — Sam will record; Dylan confident)*
  3. Get set up on 1fit *(real Loom ✅)*
  4. Track your nutrition in MyFitnessPal *(real Loom ✅ — Dylan confirmed keep)*
  5. Sign your welcome pack *(confirmation "clicker" — signing stays in Brevo; ✅ done)*
  6. Join the SS Sustain community *(real WhatsApp link ✅ — group "SS Sustained Coaching")*
  Cut: first-week (Sam: covered by his Loom video), SS-Sustain-method, intake form,
  Sheets invite (Sam handles manually). **Notion step dropped — the portal REPLACES
  Notion.** Welcome-pack signing stays in **Brevo**; portal carries only a confirm clicker.
- **GATE 2 — pending from Sam:** the **welcome video** + **portal walkthrough** video
  Loom URLs. Those are the only content blockers left; the rest of the gate is live.
- **Deferred:** email to Sam on completion (decided in-portal-only for now — roster badge
  is the proof); hook stubbed in the POST route, needs `RESEND_API_KEY` + Sam's address.
- **Referral scheme — BUILT & LIVE** (see Recently done). £100/referral, paid after 3 months
  for monthly signups, immediately for upfront 3/6/12-month plans; new client gets nothing.
  Tracking-only (no Stripe automation). SQL applied ✅; coach can convert/pay/delete leads,
  clients see their rewards + a team leaderboard.

## ✅ Recently done
- **2026-05-30 — Pending-access flow built (foundation for Stripe → portal).** See Active
  for the full breakdown. Tldr: `clients.access_granted_at` (nullable), new
  `/api/clients/grant-access` route, `pending: true` flag on `/api/invite-client`,
  amber "Pending access" pill + stat card + Grant button in the coach roster, Add-client
  modal toggle. **Run `db/2026-05-30_client_access.sql` before this works in prod** —
  without it the column doesn't exist and every existing row will look pending.
- **2026-05-29 (laptop) — Sidebar notifications moved off localStorage onto Supabase.**
  Old system: `lib/notifications.ts` stored "seen item ids" in `localStorage` under
  `ss-seen-v1`, per browser, unscoped per user → badges re-lit on logout, refresh, or a
  different machine (each new browser had no record, so every item counted as new).
  - **DB:** `db/2026-05-29_notification_seen.sql` — `notification_seen(user_id,
    section_key, seen_ids text[], updated_at)` primary key `(user_id, section_key)`,
    RLS locked. **⚠️ NOT YET RUN IN SUPABASE — see Watch out.**
  - **Route:** `app/api/notifications/seen/route.ts` — GET returns the user's whole
    map; POST upserts one section's `seen_ids`. Cookie session validated via
    `auth.getUser()`, all reads/writes via the service-role admin client scoped to
    `user.id`. (Same pattern as `tracker/me`, `onboarding/me`.)
  - **Lib:** `lib/notifications.ts` refactored. In-memory store backed by a one-time
    GET on first use; `markSeen` updates the cache + fire-and-forget POST. Hooks
    (`useUnseenCounts`, `useMarkActiveSeen`) keep their old signatures, so the
    sidebars didn't need to change. Until the GET resolves, counts return 0 so we
    never flash "everything new" before we know what's been seen.
  - **First-load semantics ("start clean", Dylan's choice):** a section with no DB row
    yet auto-seeds to its current ids the moment they're available — a brand-new
    account sees NO badges on day one. Badges only ever light for items added LATER.
    For sections with async-loading data (referrals, content contexts) the seed waits
    until ids are non-null/non-empty, so an empty fetch doesn't "lock in" emptiness.
  - **Logout no longer needs to clear it** — there's no per-browser state to nuke. The
    abandoned `ss-seen-v1` localStorage key from old sessions is harmless and unused.
- **2026-05-29 — Auth "Good morning, there." / no-name bug CRACKED + route protection back.**
  The recurring bug: a logged-in client rendered the null-user fallbacks ("there",
  sidebar "Client"/"Active client"/"??") even though the server session was valid (Settings
  still showed the full profile). Root-caused with a **5-agent diagnostic workflow** (4
  lenses + adversarial synthesis), high confidence:
  - The browser's `getSession()` takes a **token-refresh** path on load; after the API-key
    migration (legacy JWT keys disabled) that `POST /token?grant_type=refresh_token` is
    rejected → auth-js returns `{session:null}` AND wipes the cookie → `loadProfile` never
    ran → `user` null. The SERVER `getUser()` only *validates* the still-valid access token
    (no refresh), so the route guard passed — the server-valid / client-null split. Worse,
    `AuthContext` *awaited* the browser `getUser()`, which can **hang** on that stalled
    refresh, so the fallback never ran (persistent, not just intermittent).
  - **The Settings clue:** `/api/profile` works because it validates via `getUser()` but
    reads the profile with the **service-role (admin)** client. So the cookie session is
    fine — only the browser-session read path was failing.
  - **Fix (commits `c848771` → `5420ea4`):** new **`app/api/me/route.ts`** returns the
    cookie-validated identity, reading the profile via the **admin client** (like
    `/api/profile`). `context/AuthContext.tsx` now populates `user` from `/api/me` **first**
    and NEVER blocks on the hangable browser `getUser()` (it only fills `supabaseUser`
    opportunistically). `refreshProfile` uses `/api/me` too. `onAuthStateChange` re-checks
    `/api/me` before honoring `SIGNED_OUT`, so a failed *background* refresh can't wipe a
    still-valid session. Login/auth pages skip the recovery (don't contend with
    `signInWithPassword`). Also added a 2s safety cap on the loading gate.
  - **⚠️ Underlying caveat:** this makes the *display* reliable, but if the refresh grant is
    genuinely broken under the new keys, long sessions still can't auto-extend — see
    carry-forward #3.
- **2026-05-29 — Server-side route protection REINSTATED** (commit `f9e7630`).
  `app/portal/layout.tsx` + `app/coach/layout.tsx` are now **server components** that
  validate the session from cookies (`getUser` + `get_my_role`) and `redirect()` BEFORE any
  content renders — no session → `/login`, wrong role → their own home. Runs in the **Node
  runtime** (not edge), so it sidesteps the `MIDDLEWARE_INVOCATION_FAILED` crash that forced
  `middleware.ts` out. The client logic (onboarding gate, view tracking, role bounce) moved
  into `PortalShell`/`CoachShell`.
- **2026-05-29 — Invite redirect fixed** (commit `a4135c2`). A trailing slash in
  `NEXT_PUBLIC_SITE_URL` produced `…com//auth/callback`, which failed Supabase's redirect
  allow-list and dumped the invited client on `/login`. `app/api/invite-client/route.ts` now
  strips the trailing slash. (Also: Supabase URL config has Site URL + `…/**` allow-listed;
  invite tokens are single-use, so re-add the client for a fresh link.) Real client invite
  now works end-to-end (Resend domain verified, sender on `sssustain.com`).
- **2026-05-29 — Meal tracker fills the screen** (commits `015de4e`, `502f9aa`).
  `app/portal/tracker/page.tsx` was locked to a 620px column; every tab now uses the full
  ~1040px width in a two-column layout (This Week / Settings / Log Meal / Night Out), still
  stacking to one column on small screens. Tab bar stays centered; Recovery screen stays
  narrow (prose).
- **2026-05-29 — Chat widget polish** (commit `59a6b37`, parallel session): animate
  open/close + reset the conversation on close.
- **2026-05-29 — `service_role` key rotated; leak CLOSED.** Migrated off legacy JWT keys to
  the new Supabase API keys (`sb_publishable_…` anon, `sb_secret_…` service role) in Vercel +
  local `.env.local`; legacy keys disabled and the old leaked key verified dead (`401`).
  (See Watch out for the env-var specifics.)
- **2026-05-29 — Operational, done by Dylan:** ran `db/2026-05-28_tracker.sql` and
  `db/2026-05-27_client_status_reason.sql` in Supabase; verified the **Resend domain**
  (`sssustain.com`) so invites reach real clients; set **`ANTHROPIC_API_KEY`** in Vercel
  (redeploy + test the assistant from a client login to confirm it answers).
- **2026-05-28 — Social / meal tracker BUILT & shipped (per-client, coach-visible).**
  Sam's standalone HTML tracker rebuilt natively in the portal so it's per-client and Sam
  can see engagement. Commits `6ff3487` (build) + `ea19a80` (reset + overview link).
  - **DB: `db/2026-05-28_tracker.sql`** — `tracker_profiles` (per-client setup: daily
    calorie target / goal / steps / sessions) + `tracker_logs` (each off-plan meal or night
    out; weekly totals summed from `logged_on`). RLS locked; service-role routes only.
    **⚠️ NOT YET RUN IN SUPABASE — see Watch out.**
  - `lib/tracker.ts` — Sam's calorie data ported verbatim (12 drinks w/ units, 9 meal
    presets, 13 fast-food brands, late-night food, recovery suggestions) + `weekStats`
    (Monday-start) + `weekStartISO`. Plain module so the client page + API routes both import it.
  - `app/api/tracker/me` — client's own tracker (GET / POST setup / PUT log / DELETE log),
    scoped to `user.id`. `app/api/tracker/client` — coach-only read of ONE client by
    `clients.id` (GET) **+ DELETE = reset** (wipes that client's logs + setup, scoped to `coach_id`).
  - `app/portal/tracker/page.tsx` — full client UI, portal-themed: This-Week dashboard,
    Log Meal (quick picks + fast-food picker + manual), Night-Out mode (drink counter +
    units + late food), Recovery plan. Nav entry in `ClientSidebar` ("Meal Tracker", `utensils` icon).
  - `app/coach/clients/page.tsx` — expanded roster row shows a read-only **`TrackerSummary`**
    (lazy-loaded): setup chips, this-week off-plan total vs budget + status, recent logs
    (night-out tagged), and a **"Reset tracker"** button. NOTE: headline numbers are *this
    week*; the recent-logs list keeps the last 10 across weeks (so history isn't lost).
  - **Overview "recent clients" rows are now clickable** → `/coach/clients?open=<id>`; the
    roster reads the param and **auto-expands + scrolls** to that client.
  - **Decisions (Dylan):** portal-themed (done); coach sees it via the roster row (done).
    Does NOT replace 1fit/MyFitnessPal — it's the engagement layer Sam can see.
- **2026-05-28 — Community calendar days are clickable** (commit `d7b784d`).
  `components/ui/MiniCalendar.tsx`: every day is selectable now (was only days *with*
  events) — click a date to filter the events list to it; pointer + hover on all days;
  today shown subtly (accent-dim + ring) vs the solid-green selected day; the detail panel
  shows "No events scheduled this day" for empty dates. Coach Community: clicking a day also
  **prefills the add-event form's date + opens the form** (click a day → schedule on it).
- **2026-05-28 — Sidebar sign-out no longer clipped** (commit `ba84f33`).
  The added Sound-effects toggle made the footer taller; the `<aside>` was `min-h-screen`
  (unbounded) + fixed, so Sign out fell below the viewport. Fix: `h-screen` on the aside +
  `min-h-0` on the scrollable `<nav>` so it shrinks/scrolls and the footer (toggles + Sign
  out) stays pinned and fully visible at any window height.
- **2026-05-28 — Client AI assistant + sound effects + login splash (parallel session).**
  - **AI assistant** — `@anthropic-ai/sdk`; `app/api/assistant/route.ts` (Node runtime,
    client-gated, graceful 503 when `ANTHROPIC_API_KEY` is unset); `lib/assistant/knowledge.ts`
    (static guide + dynamic per-client context); `components/assistant/ChatWidget.tsx`.
    **⚠️ Needs `ANTHROPIC_API_KEY` in Vercel — see Watch out.**
  - **Sound effects** — `lib/sound.ts` + `components/layout/SoundToggle.tsx`: a soft
    nav/action click on the client portal (capture-phase listener in `Sidebar`), toggle in
    the sidebar footer, on/off persisted. Client only (coach side stays silent).
  - **Login splash** — `components/ui/LoginSplash.tsx` plays on sign-in before the hard
    nav to the dashboard.
- **2026-05-28 — Webinars now embed the Loom player inline** (matches the onboarding flow).
  `components/ui/VideoCard.tsx` gained an opt-in `embed` prop + a `loomEmbedUrl` helper
  (`loom.com/share/{id}` → `loom.com/embed/{id}`); `app/portal/webinars/page.tsx` passes
  `embed` so each webinar plays in place (Loom's own thumbnail) instead of opening a new
  tab. Training Clips still uses the clicker (same component, `embed` left off there).
  Shipped as part of commit `6ff3487`.
- **2026-05-27 (late) — DEPLOYMENT RESOLUTION: got `app.sssustain.com` live + login/onboarding working.**
  Long chain of Vercel issues, each fixed:
  1. **Vercel env vars were missing/wrong** → builds failed, then ran but broke at runtime.
     Now set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
     `NEXT_PUBLIC_SITE_URL=https://app.sssustain.com`.
  2. **`NEXT_PUBLIC_*` were marked "Sensitive"** → not shipped to the browser → anon key absent →
     all logins failed. **Fix: the two `NEXT_PUBLIC_*` must be NON-sensitive.** (`SERVICE_ROLE_KEY`
     stays sensitive — server only.)
  3. **Framework Preset was "Other"** → Vercel served the build as static files, every page 404'd.
     **Fix: Framework Preset = Next.js.** (This was the big one.)
  4. **Edge middleware kept 500-ing** (`MIDDLEWARE_INVOCATION_FAILED`) → **removed `middleware.ts`**.
  5. **`SUPABASE_SERVICE_ROLE_KEY` had the wrong value** (anon key) and later was pasted into the
     **Note** field instead of **Value** → admin client ran without privileges (RLS blocked it) →
     `/api/onboarding/me` returned `isClient:false`, `/api/clients/me` 500'd. **Fix: real
     service_role key (role `service_role`) in the Value field.**
  6. **Supabase auth lock deadlocked the browser** — `getSession()`/`get_my_role` hung, profile
     never loaded ("Hello there"). `navigator.locks` and `processLock` both hung. **Fix: no-op
     `lock` in `lib/supabase/client.ts`** (single shared browser client).
  7. Coach login flashed-then-reset and onboarding/logout were flaky → fixed the **coach & portal
     layouts** (don't redirect on a still-loading `user`), **hardened logout** (timeout so it can't
     hang), and **AuthContext** (only wipe `user` on explicit `SIGNED_OUT`).
  - **Onboarding test-mode is LIVE** (`ONBOARDING_TEST_MODE` in `lib/onboarding.ts`): client sees
    onboarding **every** login + an **admin skip button**; login clears the skip flag. **Set the
    flag to `false` at go-live** and remove the skip button.
  - **Deploys now target the `main` branch** (Vercel's production branch). We push `master:main`
    each time. Cleaner long-term: point Vercel's production branch back at `master` + delete `main`.
- **2026-05-27 (late) — Production 500 fire: edge middleware removed.**
  - Commits `01646f6` (harden middleware to fail-open) → `e95c1c0` (drop Supabase SDK
    from the edge) → `bf9ebf0` (**delete `middleware.ts` entirely**). Even a trivial
    SDK-free middleware kept throwing `MIDDLEWARE_INVOCATION_FAILED` and 500-ing every
    route on this Vercel project. Removing it got the site serving.
  - Auth still enforced: every API route validates the session (401), and login redirects
    client-side; the portal/coach **layouts** still gate by role/onboarding on the client.
  - **Server-side route protection is gone** — to be reinstated once the edge issue is
    understood (see Still to do).
- **2026-05-27 — UI / motion polish + onboarding UX (this session).**
  - **Motion foundation** in `app/globals.css`: shared `animate-fade-up / fade-in /
    scale-in / slide-down / accordion / page` utilities + a `prefers-reduced-motion`
    kill-switch. Clean & quick (150–300ms, ease-out).
  - **Page transitions** via `app/portal/template.tsx` + `app/coach/template.tsx` —
    content crossfades on navigation, sidebar stays put. **Opacity-ONLY on purpose:** a
    transform there becomes the containing block for `position:fixed` modals and breaks
    their full-screen overlay (hit + fixed this — see Watch out).
  - **Roster row** opens as a smooth accordion; **Add-client modal** fades+scales in.
  - **Count-up numbers** — `components/ui/CountUp.tsx` (`useCountUp` + `AnimatedStat`
    that parses £/%/decimals). Wired into the shared `StatCard`, so **every stat card**
    (Overview/Analytics/Revenue/Forecast/Health) counts up; plus analytics bars + key
    metrics + forecast 3-month projection.
  - **Revenue "Cash position" donut** — `components/ui/Donut.tsx` (pure SVG, sweeps in):
    collected (green) vs outstanding (amber), % collected in the centre.
  - Onboarding: inline Loom embeds, team photo, and the dev testing mode (see Active).
- **2026-05-27 (computer) — Sidebar notification ticker + client status/cancellation.**
  - **Notification badges** (`lib/notifications.ts` + both sidebars): per-tab unseen counts.
    Badge = items whose id you haven't seen; **opening the tab clears it**; a new item
    re-lights it. Pure localStorage per-browser, no DB. Coach: Roster (new clients),
    **Health (churn, red)**, Referrals (new leads). Client: events, training, posing,
    mindset, supplements, recommendations, webinars, library. NOTE: on first load it
    badges *everything* (nothing "seen" yet) and clears as you click in — flip it to
    seed-a-baseline if that's too noisy. Replaced the community pending-RSVP badge and
    Training's static "New".
  - **Client status → Active / Paused / Cancelled + reason** (`clients/page.tsx`, `Pill`,
    `lib/types` `ClientStatus`). Paused/Cancelled record a preset reason + optional note;
    roster stat cards now Active/Paused/Cancelled; Cancelled pill is red. Needs the new SQL
    (see Watch out).
  - **Phase is now a dropdown** (Fat loss / Gaining / Maintenance + custom) in the roster
    and Add-client modal, replacing free text.
  - Confirmed **Delete client** removes the clients row + auth login + onboarding rows from Supabase.
- **2026-05-27 (later) — Referral polish + platform additions (this push).**
  - Referral: coach can **delete** a lead (✕ → confirm) and the leaderboard / earned /
    pending / totals all recompute from `referral_leads`; **client-facing team leaderboard**
    on Refer a Friend (first name + last initial, **counts only, no £**, your row highlighted,
    top 10, folded into the one `/api/referral/me` fetch); fixed a StrictMode code-gen race
    that displayed a different code than was stored ("referral link no longer valid").
  - **All four migrations verified applied in Supabase** (by direct query): `referral`,
    `onboarding_progress`, `page_views`, and `last_login`. The chart/gate/scheme are live.
  - Bundled in from the parallel (onboarding) session: **notification badges**
    (`lib/notifications.ts` + sidebar unseen-counts, coach & client), **UI animation polish**
    (`CountUp`, `Donut`, route `template.tsx` transitions, animated analytics bars), and a
    new **`db/2026-05-27_client_status_reason.sql`** (pause-reason on clients) — **see Watch out**.
- **2026-05-27 — Referral scheme built (tracking + £100 payout reminders).**
  - **Decisions (Dylan):** Sam manually marks a lead "joined" + picks the plan;
    referrer sees their earned/pending £100; new client gets nothing (v1).
  - **The portal never touches Stripe/money** — it tracks who's owed £100 and when,
    and Sam ticks "paid" after his bank transfer. Sidesteps the Stripe-automation rabbit hole.
  - `db/2026-05-27_referral.sql` — `clients.referral_code` (unique) + `referral_leads`
    extended with `status`/`plan_type`/`joined_at`/`payout_due_at`/`payout_paid_at`. RLS
    locked (all access via service-role routes). **⚠️ RUN THIS IN SUPABASE** — until then
    the referral page can't generate a code and leads can't be stored.
  - `lib/referral.ts` — `REFERRAL_REWARD_GBP=100`, `computePayoutDue` (upfront→now,
    monthly→+3mo), `payoutState` (none/pending/due/paid). Single source of truth.
  - `app/api/referral/manage` (coach) — list leads + `convert` (pick plan) + `pay`/`unpay`.
    `…/me` now returns earned/pending totals; `…/leaderboard` ranks by **conversions**.
  - Coach **Referrals** page (`/coach/leaderboard`, nav relabelled) — stat cards (joined,
    owed now, upcoming, paid), a Leads & payouts table (Mark joined → Upfront/Monthly;
    Pay £100; undo), and the leaderboard. Client **Refer a Friend** page shows earned/pending.
  - **Still manual:** Sam decides when someone "joined" (no Stripe webhook). Fine for now;
    automate the convert step later if/when Stripe lands.
- **2026-05-27 — Analytics page real + view tracking + critical client-auth fix.**
  - **Analytics page real** — `app/coach/analytics/page.tsx` reads `GET /api/analytics`
    (coach-only, service-role, scoped to `coach_id`): login-activity buckets (active
    today / 7d / 30d, inactive 14+, never logged in, activation rate), referral leads +
    top referrer, community engagement, and a real **"most visited sections"** chart
    with an **All-time / Last-30-days toggle** (30-day = the engagement/churn signal;
    both use the same denominator, so the gap between them = staleness). Dropped the
    dead mock metrics (message-read, landing-conv).
  - **View tracking** — `page_views` table + `record_page_view(section)` rpc (mirrors
    `touch_last_login`). `app/portal/layout.tsx` records each section once per browser
    session via `usePathname()` — one edit, not 9 pages. Records on SUCCESS (key prefix
    `ss-pv-`), so a failed/blocked call retries instead of getting permanently stuck.
    `db/2026-05-27_page_views.sql` — **applied in Supabase ✅ (verified by query).**
  - **🛠 Fixed a deadlock that broke EVERY client login** (`lib/supabase/client.ts`):
    each `createClient()` made a NEW browser client; under React StrictMode they
    deadlocked the shared `navigator.locks` auth lock → `getSession()`/RPCs hung →
    `user` stayed null (no name/avatar/greeting, sign-out did nothing). Fix: one shared
    browser client + in-memory `processLock`. **This hit real clients, not just our
    debugging.**
  - **Fixed the portal onboarding gate trapping clients on "Loading…"**
    (`app/portal/layout.tsx`): removed the stale `ss-user` localStorage redirect loop;
    the gate now runs once on mount and fails open, so a transient error can't trap it.
    (Note: this touched the onboarding session's file — kept their DB gate intact.)
  - Greened the build: removed two pre-existing unused-symbol lint errors
    (`app/coach/content/page.tsx` `ShoppingItem`, `app/onboarding/page.tsx` `canEnter`).
    No `eslint.ignoreDuringBuilds`, so these were breaking the Vercel build on push.
- **2026-05-27 (computer) — Client top-bar `<phase> · Week N` is now real & per-client.**
  - Decision taken: Sam sets a **program start date** per client and the week
    **auto-ticks** from it (Week 1 = first week, +1 every 7 days); **phase = the
    existing `goal`** field, now editable in the roster.
  - DB: added `program_start date` to `clients` — `db/2026-05-27_client_program_start.sql`
    (RUN in Supabase ✅, with the created_at backfill).
  - New `GET /api/clients/me` lets a logged-in client read their own row (admin-scoped
    to `user_id`) — this was the blocker.
  - New `lib/my-client.ts` (`weekFromStart` / `phaseWeekLabel` / cached `useMyPhaseWeek`)
    and `components/layout/PortalTopbar.tsx` centralise the label — it was hardcoded
    on all 9 portal pages, now defined once.
  - Roster (`app/coach/clients/page.tsx`) now edits phase + program start (live
    "Currently: Week N" readout); changes flow to the client's top-bar.
- **Auth:** login, invite-accept + set password, sign out.
- **Client roster → Supabase** (overview "recent clients" too).
- **Content** (all 11 types) → Supabase; coach edits reach clients.
- **Community events + RSVPs → Supabase** (coach + client).
- **Messaging fully removed** (Sam uses WhatsApp).
- **Client Health page real** — login tracking; scores from login + payment, with a
  7-day grace for new clients.
- **Overview churn alerts real.**
- **Overview top stat cards real** — active clients, payments due, avg duration, MRR.
- **Revenue page real** — payments ledger: collected, outstanding, YTD, MRR, monthly breakdown.
- **Forecast page real** — MRR, projected annual, 3-month run-rate, per-client value.
- **Client home fixed** — real name greeting + real RSVP status; removed hardcoded "dylan".
- (Earlier this session, laptop) Cross-machine workflow setup: `CLAUDE.md`,
  `HANDOFF.md`, role-gated login, sidebar logo link, invite StrictMode fix,
  logout/AuthProvider hardening.

## ⏭️ Still to do
- **At go-live: flip `ONBOARDING_TEST_MODE` → false** (`lib/onboarding.ts`) + remove the
  admin skip button (`app/onboarding/page.tsx`). Last-minute; until then the gate shows every
  login + a prod skip button (for testing).
- **Onboarding go-live** — only Gate 2 left: Sam's **welcome video** + **portal walkthrough**
  Loom URLs (the SQL is applied). Then optionally wire the completion email to Sam.
- **Confirm refresh-token health under the new API keys.** The "there" fix made the profile
  display reliable, but verify `POST /auth/v1/token?grant_type=refresh_token` returns 2xx
  after a clean re-login. If it 4xx's (`invalid_grant`), the JWT *signing* keys may need
  attention in the Supabase dashboard — otherwise browser sessions can't auto-extend past the
  ~1h access-token lifetime and clients get silently logged out.
- **AI assistant** — `ANTHROPIC_API_KEY` is set; redeploy (if not already) and test from a
  client login. Future: feed it more SS Sustain knowledge in `lib/assistant/knowledge.ts`.
- **Meal tracker follow-ups** Sam may want: email/WhatsApp nudges on streaks or no-logs; a
  coach-side "who logged this week" summary on the overview.
- Optional: split a longer-term **goal** from the **phase** if Sam wants both —
  the top-bar currently uses the `goal` field as the phase.

## ⚠️ Watch out
- **✅ `service_role` key rotated (2026-05-29) — leak CLOSED.** The key was visible in
  screenshots during Vercel debugging. Fixed by migrating off the legacy JWT keys to the
  new Supabase API keys: `SUPABASE_SERVICE_ROLE_KEY` is now an `sb_secret_…` key and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` an `sb_publishable_…` key (both updated in Vercel + local
  `.env.local`), and the **legacy JWT keys are now disabled**. Verified the old leaked key
  is dead — REST + auth both return `401`. **Do NOT re-enable legacy keys.**
- **Deploys go to the `main` branch, not `master`.** Vercel's production branch is `main`.
  We push `master:main` each deploy. To go live, code must reach `main`. (Cleaner: set
  Vercel's production branch back to `master` in Settings → Git/Environments, delete `main`.)
- **Vercel env vars (production):** the two `NEXT_PUBLIC_*` keys must be **NON-sensitive**
  (or they won't reach the browser → logins break). Keys are now the **new Supabase API
  keys** (legacy JWT keys disabled): `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_…`,
  `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_…` (Sensitive, server-only) in the **Value**
  field. **Framework Preset must stay "Next.js"** (if it flips to "Other", every page 404s).
- **`ONBOARDING_TEST_MODE = true`** (`lib/onboarding.ts`) forces onboarding on every login +
  shows the admin skip button **in production** (for testing). **Set it `false` at go-live.**
- **Browser auth uses a no-op `lock`** (`lib/supabase/client.ts`) — both `navigator.locks`
  and `processLock` deadlocked `getSession()`. Don't re-introduce a blocking lock.
- **No edge middleware** — `middleware.ts` was removed (it 500'd the whole site). Don't
  re-add an edge middleware without solving `MIDDLEWARE_INVOCATION_FAILED` first, or the
  site goes down. **Route protection is now reinstated server-side** via the
  `app/portal/layout.tsx` + `app/coach/layout.tsx` **server components** (Node runtime,
  `getUser` + `get_my_role` + `redirect`), NOT edge middleware — keep it that way.
- **Auth/profile loads from `/api/me` (server, admin read) — do NOT make AuthContext depend
  on the browser `getSession()`/`getUser()` for the initial profile.** That browser path
  triggers a token refresh that can fail/hang under the new keys, which caused the
  "Good morning, there." bug. `context/AuthContext.tsx` populates `user` from `/api/me`
  first; `/api/me` reads the profile with the service-role client. If you refactor auth,
  preserve this — and `loadProfile`/`refreshProfile` must never null a logged-in user on a
  transient/refresh error.
- **Page transitions must stay opacity-only.** `template.tsx` uses `animate-page` (fade,
  no transform). A `transform` on those wrappers becomes the containing block for any
  `position:fixed` modal and breaks its full-screen overlay (this already bit us once).
- **All migrations applied ✅:** `onboarding_progress`, `page_views`, `referral`,
  `last_login`, `client_program_start`, `client_status_reason`, `tracker`, and
  **`notification_seen` (run 2026-05-29)**. **⚠️ `client_access` NOT YET RUN — see
  Active.** If Vercel ever points at a *different* Supabase than local `.env.local`,
  re-run them there.
- **AI assistant: `ANTHROPIC_API_KEY` is set** (Vercel → Production, Sensitive; server-only).
  If the chat ever says "not set up yet" (503), the key is missing or the deploy predates it
  — redeploy. `app/api/assistant` is client-gated and runs in the Node runtime.
- **Invite emails work** — the Resend **domain `sssustain.com` is verified** and the Supabase
  SMTP sender is on that domain, so invites reach real clients (not just the Resend account
  owner). Invite tokens are single-use; re-add a client to get a fresh link.
- **Refresh-token health (open):** verify `POST /auth/v1/token?grant_type=refresh_token`
  returns 2xx after a clean re-login under the new keys. If it 4xx's, browser sessions can't
  auto-extend past ~1h — see Still to do.

---

**Last updated:** 2026-05-30 — pending-access flow built: `clients.access_granted_at` + `/api/clients/grant-access` + roster pending-pill / stat / Grant-button + Add-client "pending" toggle. **One pending action before this works in prod: run `db/2026-05-30_client_access.sql`.** Next chunk of work is the Stripe webhook (call `/api/invite-client` with `pending: true`). Still open: flip `ONBOARDING_TEST_MODE` off + Sam's 2 videos at go-live; confirm refresh-token health.
