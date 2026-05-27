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

## 📌 Latest handoff note (2026-05-27, late) — SITE IS LIVE ✅
**`app.sssustain.com` is up and working** (login both roles, onboarding gate, profile).
Getting there was a long Vercel fight — root causes, all now fixed (see "Deployment
resolution" in Recently done): **Framework Preset was "Other" → Next.js**, **`NEXT_PUBLIC_*`
env vars were marked Sensitive → made non-sensitive**, **`SUPABASE_SERVICE_ROLE_KEY` had the
wrong value (and the key was pasted in the Note field, not Value)**, the **edge middleware
was removed** (kept 500-ing), and the **Supabase auth lock was deadlocking the browser →
replaced with a no-op lock**.

⚠️ **THREE things carry forward — see Watch out:** (1) **deploys now go to the `main`
branch** (Vercel's production branch), not `master`; (2) **server-side route protection
needs reinstating** (middleware was removed); (3) **rotate the `service_role` key** (it
appeared in screenshots during debugging). Workflow: `git pull` at start → work in ONE
place → "update the handoff and push" at end. (Setup in `CLAUDE.md`.)

---

## 🔴 Active — in progress right now
**Social / meal tracker → built into the portal (per-client, coach-visible).**
Sam's standalone HTML tracker (off-plan meal + night-out calorie logging), rebuilt
natively in the portal so it's per-client and **Sam can actually see engagement**.
- **DB: `db/2026-05-28_tracker.sql`** — `tracker_profiles` (one-time per-client setup:
  daily calorie target / goal / steps / sessions) + `tracker_logs` (each off-plan meal
  or night out; weekly totals summed from `logged_on`). RLS locked; all access via the
  service-role routes (same pattern as `page_views` / `referral_leads`).
  **⚠️ RUN THIS IN SUPABASE** — until then the tracker's GET/POST/PUT all fail.
- `lib/tracker.ts` — Sam's calorie data ported verbatim (12 drinks w/ units, 9 meal
  presets, 13 fast-food brands w/ items, late-night food, recovery suggestions) +
  `weekStats` (Monday-start weekly maths) + `weekStartISO`. Plain module (no `'use client'`)
  so the client page and the API routes can both import it.
- `app/api/tracker/me/route.ts` — the signed-in client's own tracker (GET profile +
  this-week logs / POST setup / PUT add a log / DELETE own log), scoped to `user.id`.
  `app/api/tracker/client/route.ts` — **coach-only** read of ONE client's tracker by
  `clients.id` (verifies `coach_id === user.id`, resolves their `user_id`).
- `app/portal/tracker/page.tsx` — full client UI, portal-themed (CSS vars, serif
  headings, light/dark): This-Week dashboard (budget / consumed / vs-expected, day dots,
  off-plan log w/ delete), Log Meal (quick picks + fast-food picker + manual), Night-Out
  mode (drink counter w/ units + late food), Recovery plan (shown when over). Nav entry
  added to `ClientSidebar` ("Meal Tracker", new `utensils` icon).
- `app/coach/clients/page.tsx` — the expanded roster row now shows a read-only
  **`TrackerSummary`** (lazily fetched on open): setup chips, this-week off-plan total
  vs budget + status pill, and recent logs (night-out tagged). Sam's per-client view.
- **GATE — run `db/2026-05-28_tracker.sql`,** then smoke-test: client sets up → logs a
  meal / night out → coach opens that client's row and sees it.
- **Decisions (Dylan):** adapt to the portal theme (done); coach sees it by expanding the
  client roster row (done). Does NOT replace 1fit/MyFitnessPal — it's the interactive
  engagement layer Sam can actually see.

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
- **Reinstate server-side route protection** — `middleware.ts` was deleted after edge
  500s. Today protection is client-side only (layouts) + API 401s. Re-add once the edge
  `MIDDLEWARE_INVOCATION_FAILED` cause is understood (or do it without edge middleware).
- **Social / meal tracker — BUILT (see Active).** Run `db/2026-05-28_tracker.sql`, then
  smoke-test the client→coach round-trip. Possible follow-ups Sam may want: email/WhatsApp
  nudges on streaks or no-logs, a coach-side "who logged this week" summary on the overview.
- **Onboarding go-live** — only Gate 2 left: Sam's **welcome video** + **portal walkthrough**
  Loom URLs (the SQL is applied). Then optionally wire the completion email to Sam.
- **Resend domain verification** — until done, invite emails only reach the Resend account
  owner, so a real client can't be onboarded end-to-end. Dashboard task, not code.
- Optional: split a longer-term **goal** from the **phase** if Sam wants both —
  the top-bar currently uses the `goal` field as the phase.

## ⚠️ Watch out
- **🔑 ROTATE the `service_role` key.** It was visible in screenshots while debugging the
  Vercel env vars. Supabase → Settings → API → roll the `service_role` key, then update
  `SUPABASE_SERVICE_ROLE_KEY` in Vercel (Value field, Sensitive ON, Production) **and**
  local `.env.local`, then redeploy. Do this before real client data is in.
- **Deploys go to the `main` branch, not `master`.** Vercel's production branch is `main`.
  We push `master:main` each deploy. To go live, code must reach `main`. (Cleaner: set
  Vercel's production branch back to `master` in Settings → Git/Environments, delete `main`.)
- **Vercel env vars (production):** the two `NEXT_PUBLIC_*` keys must be **NON-sensitive**
  (or they won't reach the browser → logins break). `SUPABASE_SERVICE_ROLE_KEY` must be the
  real `service_role` key (role `service_role`) in the **Value** field. **Framework Preset
  must stay "Next.js"** (if it flips to "Other", every page 404s).
- **`ONBOARDING_TEST_MODE = true`** (`lib/onboarding.ts`) forces onboarding on every login +
  shows the admin skip button **in production** (for testing). **Set it `false` at go-live.**
- **Browser auth uses a no-op `lock`** (`lib/supabase/client.ts`) — both `navigator.locks`
  and `processLock` deadlocked `getSession()`. Don't re-introduce a blocking lock.
- **No edge middleware** — `middleware.ts` was removed (it 500'd the whole site). Don't
  re-add an edge middleware without solving `MIDDLEWARE_INVOCATION_FAILED` first, or the
  site goes down. Route protection is currently client-side only.
- **Page transitions must stay opacity-only.** `template.tsx` uses `animate-page` (fade,
  no transform). A `transform` on those wrappers becomes the containing block for any
  `position:fixed` modal and breaks its full-screen overlay (this already bit us once).
- **Applied ✅ (verified by query):** `db/2026-05-27_onboarding_progress.sql`,
  `db/2026-05-27_page_views.sql`, `db/2026-05-27_referral.sql`, and `last_login`.
  If Vercel ever points at a *different* Supabase than local `.env.local`, re-run them there.
- **`db/2026-05-27_client_status_reason.sql` — RUN IN SUPABASE (not yet verified).** Adds
  `status_reason` + `status_note` to `clients` for the new Paused/Cancelled reasons. Until
  applied, saving a Paused/Cancelled client errors. (If a CHECK constraint blocks the
  'Cancelled' value, drop it — see the note in the SQL file.)
- **`db/2026-05-28_tracker.sql` — RUN IN SUPABASE (not yet applied).** Creates
  `tracker_profiles` + `tracker_logs` for the meal tracker. Until applied, the tracker
  page can't save setup or log meals, and the coach's roster TrackerSummary shows empty.
- Invite emails: Resend sandbox sender only reaches the Resend account owner until a
  domain is verified in Resend + the Supabase SMTP "from" is updated.

---

**Last updated:** 2026-05-28 — social/meal tracker built (per-client, coach-visible; needs `db/2026-05-28_tracker.sql` run in Supabase); webinars now embed Loom inline
