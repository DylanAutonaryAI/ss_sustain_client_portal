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

## 📌 Latest handoff note (2026-07-05) — Security remediation shipped + per-client billing
Two things landed this pass, both **pushed to `master` (auto-deployed)** and, where DB
was involved, **applied + verified against the live database**. Full detail in Recently
done; the short version:

1. **Full security audit + remediation — SHIPPED, non-breaking.** A read-only multi-agent
   audit (5 areas + adversarial verification) found **1 critical, 0 high, 4 medium, 21
   low**. The **critical** (any authenticated user could self-promote client→coach via an
   unguarded `profiles` UPDATE) is **fixed and verified against the live DB**. All 4
   mediums + most lows fixed. A second adversarial pass confirmed **zero broken flows,
   zero ineffective fixes**. Commits `fca29cc` + `f5c6603`.
2. **Per-client billing frequency + robust roster import.** `monthly_amount` is now
   *amount per payment*; MRR divides by a new `billing_interval_months` (1/3/6/12). The
   client importer is header-aware + value-based (any column order) and creates clients
   **without sending emails**. Commits `ba1056a`, `ef70aec`, `cdd3497`, `52d50a6`.

**Deferred on purpose — do NOT apply without a decision** (each documented in Recently
done + Watch out): `db/DEFERRED_multi_coach_rls.sql` (latent until a 2nd coach), the
Next 16 upgrade (breaking; mitigated by Vercel), and two minor auth lows needing bigger
flows. **`ONBOARDING_TEST_MODE` is deliberately still ON — not going live yet.**

---

## 📎 Prior note (2026-06-04) — Stripe sandbox flow verified + roster About block
**Stripe sandbox → portal verified end-to-end** with a real test purchase (£185, card
`4242…`) on 2026-06-04 — pending client appeared in the roster within seconds. Roster
follow-up shipped same day: every row now shows the **email** under the name, a
purple **"via Stripe"** chip on Stripe-originated rows, and the expanded row has a new
full-width **"About"** panel (email, phone/WhatsApp, birthday, last login, phase ·
week, member since) plus a **"Stripe — Subscription details"** block (customer ID,
sub ID, next billing, **Open in Stripe ↗** deep-link) that only renders when the row
has a Stripe sub. **Phone is editable inline in the About block** with a click-to-WhatsApp
link — Sam's primary client comms channel, now one click away.

⚠️ **Carry-forward before this works in prod (in order):**
1. **Run `db/2026-06-04_client_phone.sql`** in Supabase — adds `clients.phone`. Without
   it, saving phone fails and the Stripe webhook errors if Stripe ever returns a phone
   on `customer_details`.
2. **Repeat the sandbox flow in LIVE mode** when Sam's ready. Create a Live-mode event
   destination at the same URL, replace both Vercel env vars with live `sk_live_…` and
   `whsec_…`. **Live keys go straight into Vercel — never paste them in chat.**
3. **Flip `ONBOARDING_TEST_MODE` → false** (`lib/onboarding.ts`) + remove the admin skip
   button — last-minute, do at go-live.
4. **Sam's 2 Loom videos** (welcome + portal walkthrough) — the only thing blocking
   onboarding go-live.
5. **Confirm refresh-token health under the new keys** — the "there" fix populates the
   profile from the server reliably, but if `grant_type=refresh_token` is genuinely broken
   (vs a stranded pre-migration session), browser sessions still can't auto-extend past the
   access-token lifetime (~1h). A clean sign-out → sign-in + a Network check on
   `POST /auth/v1/token?grant_type=refresh_token` (should be 2xx) confirms it.

Deploys go to **`master`** (Vercel's production branch was switched from `main` →
`master` on 2026-05-30 — see Recently done). A plain `git push origin master` now
auto-deploys to production. Workflow: `git pull` at start → work in ONE place →
"update the handoff and push" at end. (Setup in `CLAUDE.md`.)

---

## 🟢 Active — nothing in progress (security pass shipped 2026-07-05)
The 2026-07-04→05 work is **done and pushed**; nothing is mid-flight. What remains before
real clients go live is **operational only** — see the carry-forward at the top and Still
to do. `ONBOARDING_TEST_MODE` is deliberately still **ON**.

---

## 🟢 Recently done — 2026-07-04→05 pass

### Security audit + remediation (SHIPPED, verified non-breaking) — `fca29cc`, `f5c6603`
A read-only multi-agent audit (5 independent areas + adversarial verify + a completeness
loop) graded the codebase: **1 critical, 0 high, 4 medium, 21 low**. Then a fix pass that
was explicitly constrained to *not change how any legit flow works*, re-checked by a
3-lens adversarial workflow (**result: zero broken flows, zero ineffective fixes**; 3
nits found and fixed).
- **CRITICAL — client→coach self-promotion — FIXED + verified on the live DB.** The
  `profiles` UPDATE policy had a null WITH CHECK and `authenticated`/`anon` held an UPDATE
  grant on the `role` column, so any signed-in user could promote themselves to coach.
  `db/2026-07-04_fix_profiles_role_escalation.sql` **revokes UPDATE on `profiles` from
  `authenticated`/`anon`** — grant is now only `postgres`/`service_role`. Verified by
  direct query: 1 coach row (Sam), 0 unexpected roles. The browser never writes `profiles`
  (confirmed: zero direct browser table writes), so nothing legit breaks.
- **All 4 mediums fixed:** community RSVP privacy (clients now see peers as first-name +
  initial, **no** private decline reasons; coach still sees everything —
  `app/api/community/route.ts`); assistant **denial-of-wallet** (per-user 60/day cap,
  fail-open — `app/api/assistant/route.ts`); referral **spam + code-enumeration** (per-IP
  rate limit, unique `(referrer, lower(email))` index, self-referral drop, and an
  **identical `{ok:true}` response** for valid/invalid/self so it can't be used to test
  codes — `app/api/referral/submit/route.ts`).
- **Most lows / hardening:** security headers (X-Frame-Options DENY, CSP
  `frame-ancestors 'none'`, nosniff, referrer, permissions — **scoped so Loom embeds +
  next-image are untouched**, `next.config.mjs`); `signout` POST-only (CSRF); `PATCH
  /api/clients` now coach-gated + a **column allow-list** (blocks mass-assignment of
  `role`/`access_granted_at`/etc.); password change requires **current-password re-auth**
  + min 8 + throttle; email change genericised + throttled; avatar **magic-byte sniff** +
  fixed overwrite path; RPC execute grants + the `clients` ALL policy locked to
  authenticated coaches (`db/2026-07-04_fix_clients_policy.sql`).
- **New infra:** `lib/rate-limit.ts` — DB-backed fixed-window limiter, **fail-open**
  (`db/2026-07-04_rate_limits.sql`); `db/2026-07-04_security_hardening.sql` (RPC grants +
  referral dedup index). All four 2026-07-04 security migrations **applied + verified**.
- **DEFERRED — documented, NOT applied (needs a decision, not a to-do):**
  - `db/DEFERRED_multi_coach_rls.sql` — scopes the `USING(true)` content/community/rsvp
    read policies per-coach. **Latent today** (one coach ⇒ current behaviour is intended);
    it rewrites load-bearing read policies, so **apply + test on a preview BEFORE adding a
    2nd coach.**
  - **Next.js CVEs** — only fixable by a **Next 16 major upgrade (breaking)**; mitigated by
    Vercel's platform. Needs its own tested effort.
  - Two minor lows needing bigger flows: invite-token single-use, email ownership-verify
    (needs working SMTP templates).

### Per-client billing frequency + robust import — `ba1056a`, `ef70aec`, `cdd3497`, `52d50a6`
- **`monthly_amount` redefined as *amount per payment* (installment).** MRR is now
  `monthly_amount / billing_interval_months` (`lib/payments.ts`). New
  `clients.billing_interval_months` ∈ {1,3,6,12}
  (`db/2026-07-04_client_billing_interval.sql` + `_client_monthly_amount.sql`, applied).
  Roster Payments block: **"Amount per payment" + "Billing frequency" dropdown**;
  `mark-paid` rolls `next_payment_date` by the interval; the Stripe webhook derives the
  interval from the price.
- **Non-Stripe flow streamlined:** monthly rate + one-click "received"; **payments are now
  deletable** on the Revenue page if entered wrong.
- **Roster importer** (`components/coach/ImportClientsModal.tsx`): header-aware column
  mapping (any order) + value-based multi-row inference. **Import creates pending clients
  and sends NO emails** — for Sam's 27-client sheet.
- **`scripts/run-migration.mjs`** — pg-based migration runner (reads `SUPABASE_DB_URL`,
  transaction-wrapped, refuses drop/truncate/delete without `--force`) so migrations can
  be applied directly.

### Onboarding videos — BOTH embedded (2026-07-03)
**Onboarding steps 1 (welcome) and 2 (portal walkthrough) are BOTH DONE.** Sam sent
each as an **mp4** (not a Loom). Both masters are HEVC (browsers can't play HEVC) and
were re-encoded to committed, web-ready H.264 copies; the masters are **gitignored**:
- Step 1 `welcome` → `/images/welcome-video.mp4` (23.6MB). Master
  `public/images/sssustain welcome video.mp4` gitignored.
- Step 2 `portal-tour` → `/images/portal-walkthrough-video.mp4` (12.8MB, ~4:49,
  duration label "5 min"). Master `public/images/sam portal walkthrough.mp4` gitignored.
  Note: source was 2010×1080 (odd width) — the re-encode forces even dims via
  `scale=trunc(iw/2)*2:trunc(ih/2)*2` so H.264 `yuv420p` is happy.
Both play through the `isLocalVideo` path in `app/onboarding/page.tsx` (any step `url`
starting `/` and ending `.mp4` → native `<video controls>`; the Loom-iframe path is
untouched). Verified on a production build + `next start`: onboarding 200, walkthrough
serves `video/mp4` (12.8MB) with `Accept-Ranges: bytes`, range request → 206.
**All onboarding content blockers are now cleared.** Remaining before go-live is
operational only: flip `ONBOARDING_TEST_MODE` → false in `lib/onboarding.ts` + remove
the admin skip button; optionally wire the completion email to Sam.
Recipe for any future Sam mp4: ffmpeg H.264 CRF 22–23 / 25fps / AAC 128k / `+faststart`
(+ even-dims scale filter if the source is odd), commit the small copy, gitignore the master.

---

## 🟢 Earlier active — nothing else in progress
**Stripe sandbox flow is DONE, verified, and shipped.** Sandbox event destination is
live in Sam's account, both Vercel env vars set, `db/2026-05-30_stripe_integration.sql`
applied and verified by a real test purchase (£185, card `4242…`). Pending client
appeared in the roster correctly. Roster "About" + Stripe details follow-up also
shipped. **Open item before this works in prod for real clients: run
`db/2026-06-04_client_phone.sql`, then repeat the same Stripe setup in LIVE mode** (new
event destination + replace Vercel keys with `sk_live_…` / `whsec_…`).

---

### Earlier this session — Stripe webhook details (kept for cross-machine reference)
- **Built this session:**
  - `app/api/stripe/webhook/route.ts` — Node runtime, signature-verified via
    `stripe.webhooks.constructEvent`. Handles `checkout.session.completed` (creates
    pending client), `invoice.paid` (bumps `next_payment_date` for renewals — skips the
    `subscription_create` first invoice), `customer.subscription.deleted` (auto-marks
    `Cancelled` + reason "Stopped paying"). Returns graceful 503 until env vars are set.
  - `db/2026-05-30_stripe_integration.sql` — `clients.stripe_customer_id` +
    `stripe_subscription_id`, with a **unique index on `stripe_subscription_id`** that
    is the idempotency key (Stripe retries can't double-create a client).
  - `stripe@^17.7.0` added to `package.json`.
- **Sam-side setup done (in this Stripe Sandbox):** event destination
  `https://app.sssustain.com/api/stripe/webhook` listening for the 3 events above.
  Signing secret + sandbox secret key in hand (Dylan added to Vercel).
- **What turns it on (carry-forward list above):**
  1. Run `db/2026-05-30_stripe_integration.sql`.
  2. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel.
  3. Real test purchase via the Framer Payment Link (sandbox, card `4242…`) → pending
     client should appear in the roster.
- **Notes / gotchas (also in Watch out):**
  - "Send test webhook" from Stripe's destination page uses Stripe's *example* payload,
    which doesn't reference a real subscription — so `checkout.session.completed` test
    events will 5xx when we try to retrieve the subscription. That's expected and fine
    for now. The real test is the real purchase flow.
  - The webhook routes new clients to the single coach (`profiles.role='coach'`). If
    a second coach is ever added, we'll need to route by Stripe product/price ID.

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
- **2026-05-30 — Settings password change fixed + the REAL cause: Vercel deploy mismatch.**
  - Symptom: the client Settings → Password "Change password" button hung on "Saving…"
    forever. First fix: the browser `supabase.auth.updateUser({ password })` call hangs
    after the API-key migration (same root cause as `getUser`/`getSession`), so it now
    posts to a **new `app/api/profile/password/route.ts`** that sets the password via the
    admin client (mirrors `/api/profile/email`). Client `savePassword` wrapped in
    try/finally + a 15s `AbortController` so the button can never get permanently stuck.
  - **But the fix kept "not working" — because it never reached production.** Pinned it
    down: every push to `master` was only making a **Preview** deployment (Vercel's
    production branch was `main`), so `app.sssustain.com` was frozen on the last manually
    promoted build. Diagnosis trick that nailed it: a brand-new route returns **404 on the
    domain** but **401 on the per-commit `*.vercel.app` preview URL** → frozen deploy, not
    a code bug. **Fix: switched the production branch to `master`** (see Watch out). This
    HANDOFF push is the first auto-deploy under the new setting.
- **2026-05-30 — Pending-access flow built, APPLIED & TESTED ✅ (foundation for Stripe → portal).**
  Migration `db/2026-05-30_client_access.sql` run in Supabase 2026-05-30; adding clients from
  the roster verified working (normal-invite + "Add as pending"). What it is:
  `clients.access_granted_at` (nullable; NULL = pending); new `/api/clients/grant-access` route
  (sends the invite + stamps the column, idempotent, handles "user already exists in auth");
  `pending: true` flag on `/api/invite-client` (inserts a pending row with `user_id` /
  `access_granted_at` null and sends NO email); `lib/clients.ts` derives
  `pending = !access_granted_at` and shields pending clients from churn/health metrics; coach
  roster UI (`app/coach/clients/page.tsx`): amber **"Pending access"** pill + 5th stat card +
  full-width **"Grant access & send invite"** banner + Add-client **"Add as pending"** toggle.
  Smoke path: Add as pending → Pending pill → open row → Grant access → invite arrives → client
  sets password + signs in → pill flips to Active.
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
- **2026-05-29 (late) — Login stuck on "Signing in…" CRACKED (verified vs the installed SDK,
  then adversarially reviewed by a 3-agent workflow before shipping).**
  - **Mechanism (verified, not guessed):** auth-js `signInWithPassword` AWAITS
    `_notifyAllSubscribers('SIGNED_IN')` before returning (GoTrueClient.js:850), and that
    awaits EVERY `onAuthStateChange` callback (:3954-62). Our subscriber awaited
    `loadProfile()` → browser `get_my_role` rpc → the call class that hangs post-migration →
    **sign-in succeeded on the network but `signInWithPassword` never returned**. The login
    page's own browser `get_my_role` await was a second wedge point.
  - **Fix:** subscriber is now fire-and-forget (never awaits); `loadProfile` DELETED —
    AuthContext does zero browser DB queries; login's role check now hits `/api/me` (reads
    the cookies sign-in just wrote), with the json read inside an 8s race and a 15s race on
    sign-in itself; `lib/with-timeout.ts` shared helper; same-class timeout added to
    forgot-password. (Settings password-change was independently fixed on the other machine
    via the server route `/api/profile/password` — that version was kept.)
  - **Hardening from the adversarial review:** `/api/me` now returns **503 on transient
    getUser/rpc failures** vs 200 `{user:null}` only when the server POSITIVELY confirms
    no session (so a blip can't sign a real client out with "no portal access"); `fetchMe`
    is tri-state and only a definitive null clears state; **coach layout now FAILS CLOSED**
    (`role !== 'coach'` → `/portal/home`) while the portal layout deliberately tolerates a
    null role (least privilege; a blip can't lock a client out).
  - See the **AUTH INVARIANTS** in Watch out before touching any of this.
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
- **Deploys go to `master` (FIXED 2026-05-30).** Vercel's production branch (Settings →
  Environments → Production → Branch Tracking) is now **`master`**, so a plain `git push
  origin master` auto-deploys to production. Previously it was `main`, so pushes to master
  only made **Preview** builds and the live site silently froze until someone manually
  promoted — that wasted a whole session (the password-change "stuck on Saving" hunt was
  really just the fix never reaching prod). The stale `main` branch can be deleted; nothing
  tracks it now. **Don't point the production branch back at `main`.**
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
- **AUTH INVARIANTS (hard-won — preserve all three if you touch auth):**
  1. **AuthContext performs ZERO browser-client DB queries.** The profile comes from
     `GET /api/me` (server `getUser()` + service-role profile read). Tri-state contract:
     200 `{user}` = session; 200 `{user:null}` = POSITIVELY no session; **503 = transient,
     treat as unknown — never as signed-out** (`fetchMe()` returns `undefined` for it, and
     only a definitive `null` clears the in-memory user).
  2. **`onAuthStateChange` callbacks must NEVER await anything.** auth-js AWAITS every
     subscriber inside `signInWithPassword` (GoTrueClient `_notifyAllSubscribers`) before it
     returns — an awaited slow/hung call there is what wedged the login button on
     "Signing in…". Fire-and-forget only.
  3. **Every browser-client auth call behind a button is raced with `withTimeout`**
     (`lib/with-timeout.ts`): login 15s, /api/me 8s (json read INSIDE the race), reset 10s,
     mismatch signOut 2.5s. (Settings password-change avoids the browser client entirely —
     server route `/api/profile/password` + 15s AbortController.) The browser token machinery
     can hang under the new keys; a timeout + error beats a stuck spinner. (`loadProfile` no
     longer exists — it was the wedge and was deleted.)
- **Page transitions must stay opacity-only.** `template.tsx` uses `animate-page` (fade,
  no transform). A `transform` on those wrappers becomes the containing block for any
  `position:fixed` modal and breaks its full-screen overlay (this already bit us once).
- **All migrations applied ✅:** `onboarding_progress`, `page_views`, `referral`,
  `last_login`, `client_program_start`, `client_status_reason`, `tracker`,
  `notification_seen` (run 2026-05-29), `client_access` (run 2026-05-30),
  `stripe_integration` (run 2026-06-04), and the **2026-07-04 batch** —
  `client_monthly_amount`, `client_billing_interval`, `fix_profiles_role_escalation`,
  `security_hardening`, `rate_limits`, `fix_clients_policy` (all applied + verified by
  direct query). **⚠️ `client_phone` (added 2026-06-04) — confirm it's run** (needed for
  the roster phone/WhatsApp field + Stripe `customer_details.phone`).
  **⛔ `db/DEFERRED_multi_coach_rls.sql` is intentionally NOT applied** — do not run it
  until a 2nd coach is being added, and test on a preview first (see the security entry in
  Recently done). If Vercel ever points at a *different* Supabase than local `.env.local`,
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

**Last updated:** 2026-07-05 — **Security audit + remediation shipped** (`fca29cc`, `f5c6603`): critical client→coach self-promotion fixed + verified on the live DB, all 4 mediums + most lows fixed, adversarially re-verified as non-breaking; deferred items (multi-coach RLS, Next 16 upgrade, 2 minor auth lows) documented, not applied; `ONBOARDING_TEST_MODE` deliberately left ON. Plus **per-client billing frequency** (amount-per-payment + 1/3/6/12-month interval, MRR divides by interval) and a **header-aware / value-based roster importer** (creates pending clients, sends no emails) for Sam's 27-client sheet. Full detail in Recently done.

**Earlier (2026-06-04):** **Stripe sandbox flow verified end-to-end** with a real test purchase (£185, card `4242…`): `checkout.session.completed` → pending client appeared in the roster within seconds. Roster follow-up: every row now shows email under the name, a "via Stripe" chip on Stripe rows, and the expanded row has a new **About** block (email, phone/WhatsApp w/ click-to-WhatsApp, birthday, last login, phase·week, member since) plus a **Stripe — Subscription details** block (customer/sub IDs + Open in Stripe deep-link, Stripe rows only). Phone is editable inline. **One pending action: run `db/2026-06-04_client_phone.sql`.** Then ready to repeat the Stripe setup in LIVE mode for real clients. Still open for go-live: flip `ONBOARDING_TEST_MODE` off + Sam's 2 Loom videos; confirm refresh-token health.

**Plus (rebased in on top):** the **login "Signing in…" wedge is cracked** — auth-js awaits `onAuthStateChange` subscribers inside `signInWithPassword`; the subscriber is now fire-and-forget, the login role check goes via `/api/me`, and every auth call behind a button is timeout-raced. **See the AUTH INVARIANTS in Watch out before touching auth.**
