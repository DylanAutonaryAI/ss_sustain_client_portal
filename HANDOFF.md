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

## 📌 Latest handoff note (2026-05-27)
Two workstreams landed and were pushed together: (1) the **client onboarding flow made
real** (engine + coach visibility; still gated on SQL + Sam's content — see Active), and
(2) the **coach Analytics page made real + portal view tracking**, which also surfaced
and fixed a **critical client-login auth deadlock** and the portal onboarding-gate
infinite-"Loading" loop (see Recently done). Verified deploy-safe (tsc + lint clean) and
pushed to `master`. Workflow reminder: `git pull` at start → work in ONE place → "update
the handoff and push" at end. (Cross-machine setup is in `CLAUDE.md`.)
NOTE: pushing to `master` auto-deploys to Vercel (production) — test locally first.

---

## 🔴 Active — in progress right now
**Onboarding flow → made real. Engine built; going-live is gated on 2 things.**
- Was a front-end shell (localStorage only, no coach visibility, skippable,
  duplicate-id bug). Now Supabase-backed:
  - `db/2026-05-27_onboarding_progress.sql` — new `onboarding_progress` table +
    `clients.onboarding_completed_at`.
  - `lib/onboarding.ts` — canonical steps, stable keys (replaces the deleted
    `lib/mock-data/onboarding.ts`); steps needing real content flagged `placeholder`.
  - `app/api/onboarding/me/route.ts` — GET progress / POST mark-step + stamp completion.
  - `app/onboarding/page.tsx` — wired to the API; sequential open-then-confirm;
    resumes cross-device; **admin-skip removed**.
  - `app/portal/layout.tsx` — gate now reads the DB, not the browser.
  - `app/coach/clients/page.tsx` — roster shows onboarding status (Not started /
    N of M / Onboarded ✓ + date). Sam's in-portal proof.
- **⚠️ GATE 1 — run `db/2026-05-27_onboarding_progress.sql` in Supabase.** Until then
  the onboarding API errors (table/column missing). Optional grandfather block inside
  marks current clients onboarded so the DB gate doesn't bounce them.
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
- **Referral scheme terms captured** (separate feature, not onboarding): £100/referral,
  paid after 3 months if they sign up monthly, paid immediately if they join upfront on
  a 3/6/12-month plan. Feeds the still-to-build referral page + leaderboard.

## ✅ Recently done
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
- **Leaderboard (coach) + Referral page (client)** — need a referral-tracking system built.
- **Onboarding go-live** — run the SQL (Gate 1), slot in Sam's content (Gate 2),
  then optionally wire the completion email to Sam.
- **Confirm the `last_login` SQL was actually run in Supabase.**
- Optional: split a longer-term **goal** from the **phase** if Sam wants both —
  the top-bar currently uses the `goal` field as the phase.

## ⚠️ Watch out
- **Run `db/2026-05-27_onboarding_progress.sql`** — the onboarding flow won't work
  until this is applied in Supabase (the portal gate now reads the DB, not localStorage).
- **`db/2026-05-27_page_views.sql` — applied ✅** (analytics sections chart is live).
  If the Vercel project ever points at a *different* Supabase than local `.env.local`,
  re-run it there too.
- **Referral feature still needs doing** (leaderboard + client referral page depend on it).
- Invite emails: Resend sandbox sender only reaches the Resend account owner until a
  domain is verified in Resend + the Supabase SMTP "from" is updated.

---

**Last updated:** 2026-05-27 — analytics + client-auth-fix session (computer)
