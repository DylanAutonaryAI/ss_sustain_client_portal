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

## 📌 Latest handoff note (2026-05-26)
Snapshot of the whole project state below. The build is well underway — auth and
most coach/client features are wired to Supabase and pushed to GitHub. The one
thing left mid-flight is the client top-bar (`Bulk · Week 8`), stopped on a design
decision (see Active). Workflow reminder: `git pull` at start → work in ONE place →
"update the handoff and push" at end. (Cross-machine setup is documented in `CLAUDE.md`.)

---

## 🔴 Active — in progress right now
**Client top-bar `Bulk · Week 8` → make it real (stopped mid-decision).**
- Currently hardcoded as `statusLabel="Bulk · Week 8"` across the 9 portal pages
  under `app/portal/` (home, community, library, mindset, posing, recommendations,
  supplements, training, webinars).
- Plan: `goal = phase` (make editable in the coach roster); `week` = auto-count
  from join date OR a Sam-set start date.
- Blocker/need: a way for a **client to read their own record** (their goal/phase +
  start date) so the top-bar can render real per-client values.
- **Decision still open** (auto-from-join-date vs Sam-set start date). **Not started
  in code.**

## ✅ Recently done
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
- **Analytics page (coach)** — still mock.
- **Leaderboard (coach) + Referral page (client)** — need a referral-tracking system built.
- **Onboarding page (client)** — not checked yet.
- **Confirm the `last_login` SQL was actually run in Supabase.**

## ⚠️ Watch out
- **Referral feature still needs doing** (leaderboard + client referral page depend on it).
- Invite emails: Resend sandbox sender only reaches the Resend account owner until a
  domain is verified in Resend + the Supabase SMTP "from" is updated.

---

**Last updated:** 2026-05-26 — laptop
