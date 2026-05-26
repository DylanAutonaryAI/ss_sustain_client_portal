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

## 📌 Latest handoff note (2026-05-26, from the laptop — read this first)
Context for whoever picks this up on the computer — here's what we just did and
agreed in the laptop session. This session was about **workflow setup**, not app
features:

- Connected the project to GitHub properly and pushed everything that had only
  been living on the laptop (~54 uncommitted changes).
- Worked out that **chat history does NOT sync between machines or even between
  terminals** — only what's committed to the repo travels. So we created two files
  to carry context across machines:
  - `CLAUDE.md` — the project brief; it **auto-loads at the start of every session**.
  - `HANDOFF.md` (this file) — the **live "what we're working on now" state**. It is
    meant to be **overwritten to match reality** each handoff, so finished work
    never lingers as "Active".
- Stopped tracking `.claude/settings.local.json` (per-machine, not shared).
- Agreed the working rhythm: **`git pull` at the start → work in ONE place →
  "update the handoff and push" at the end.** If a push is rejected, `git pull`
  then push again. Never edit the same task on both machines at once.
- Confirmed the app's real assets (logos, progress pics, the PDFs) live in
  `public/` and already sync; only the loose outer folders (duplicate logos + the
  Notion source archive) don't.

So on the computer: read this note + `CLAUDE.md`, then carry on. When Dylan says
"update the handoff and push," overwrite the Active section below to reflect what's
actually in progress (and clear anything that's finished).

---

## 🔴 Active — in progress right now
**Top bar: make the hardcoded phase/week real & per-client.**
- Today every portal page shows a hardcoded `statusLabel="Bulk · Week 8"` —
  it's copy-pasted into the `<Topbar>` of all 9 pages under `app/portal/`
  (home, community, library, mindset, posing, recommendations, supplements,
  training, webinars).
- Goal: show each client's real goal + their actual week, centralised so it's
  defined in ONE place, not duplicated 9×.
- **Decision still to confirm with Dylan:** auto-count the week from each
  client's join date (recommended — correct by default, with a Sam-set override),
  vs. Sam manually sets the start/week per client.
- **Intended machine:** computer.

## ✅ Recently done (most recent first — keep ~last 10)
- 2026-05-26 (laptop) — Added `CLAUDE.md` (project brief, auto-loads) and this
  `HANDOFF.md`; stopped tracking `.claude/settings.local.json`.
- 2026-05-26 (laptop) — Role-gated login tabs (clients sign in under Client,
  coaches under Coach; mismatch is rejected and signed out).
- 2026-05-26 (laptop) — Sidebar logo/title now links to the role's home with a
  green hover state.
- 2026-05-26 (laptop) — Hardened logout (clears session client-side) and
  `AuthProvider` (no longer breaks on a stale/revoked session).
- 2026-05-26 (laptop) — Fixed invite acceptance always showing "expired"
  (React StrictMode was double-running the callback effect and wiping the token).
- 2026-05-26 (laptop) — Got the invite email working via Resend (Supabase custom
  SMTP); confirmed the 403 cause = unverified sender domain.

## ⏭️ Next up / backlog
- Verify a sender domain in Resend + update Supabase SMTP "from" so invites can
  go to real client emails (currently sandbox-limited to the Resend owner).
- Migrate remaining Notion content into the portal (source archive lives outside
  the repo on the laptop: `old notion client portal data & images/`).

---

**Last updated:** 2026-05-26 — laptop
