# SS Sustain Client Portal — Project Context

## ⚠️ FIRST: read & maintain HANDOFF.md
Work happens across two machines (laptop ↔ computer) and chat history does NOT
sync between them — `HANDOFF.md` is how the "what we're working on now" context
is carried over git.
- **At the START of a session:** read `HANDOFF.md` to see the live working state.
- **At the END of a session (before pushing):** UPDATE `HANDOFF.md` to match
  reality — move finished work from "Active" into "Recently done", and set
  "Active" to whatever is now in progress (or mark it idle). **Overwrite stale
  entries; never leave a finished task marked Active.**

## What this is
A custom client portal for SS Sustain, an online bodybuilding coaching
business run by Sam Sutton. It replaces his current Notion client area.
Two types of user: CLIENTS and the COACH (Sam). Built to look coherent
with the SS Sustain landing page and brand (same logo, fonts, colours).

---

## CURRENT STATUS (updated 2026-05-26)
Phase 1 is essentially done. The HTML prototype is now a working Next.js 14
app with the brand design (dark/light toggle, fonts, colours), both the
client portal and coach backend, deployed on Vercel. GitHub repo:
`DylanAutonaryAI/ss_sustain_client_portal` (auto-deploys on push to `master`).

**Supabase IS now wired up** — the older notes below that say "not wired up
yet / do not set up Supabase" are OUTDATED. What's live:
- Auth: email/password login, role-gated tabs (client vs coach), middleware
  route protection, `get_my_role` RPC, `profiles` + `clients` tables.
- Coach "Add client" sends a Supabase invite email; the client sets their
  password at `/auth/callback` → `/api/set-password`. Forgot-password works too.
- Email delivery: **Resend**, configured as Supabase's custom SMTP. Sending to
  arbitrary recipients requires a **verified domain in Resend** — the sandbox
  `onboarding@resend.dev` sender only delivers to the Resend account owner.
- API routes back most features: clients, community, content, payments,
  referral, profile, password reset/update.
- Still on mock/seed data: onboarding flow, `ClientContext`, `ContentContext`.

**Env vars** (NOT in git — set per machine via `.env.local`, or `vercel env pull`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

**Done in the 2026-05-26 session:**
- Fixed invite acceptance always showing "expired" (React StrictMode was
  double-running the callback effect and wiping the URL token).
- Hardened logout to clear the session client-side; `AuthProvider` no longer
  breaks on a stale/revoked session.
- Role-gated the login tabs (clients sign in under Client, coaches under Coach).
- Sidebar logo/title links to the role's home, with a hover state.

---

## Architecture
One app, one login. After authentication, check the user's role and
route COACH to the backend dashboard and CLIENTS to the portal. Build
the role system so it can support MULTIPLE coaches/admins later — Sam
may bring another coach onto the brand who would get their own admin
login with the same controls.

## Tech stack (target)
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase for auth + database (NOW WIRED UP — see CURRENT STATUS above)
- Vercel for hosting
- Will later add Stripe, Make automations, Voiceflow AI agent
- Investigate making it installable as a PWA ("add to home screen")
  so it feels like an app. For now it's a website.

## Original goal (PHASE 1 — now largely complete; kept for context)
Convert the existing HTML prototype (ss-sustain-portal-v3.html) into a
proper Next.js app with reusable components. Keep the EXACT visual
design — fonts, colours, dark/light toggle, layout. (This was done with mock
data first; Supabase has since been wired up — see CURRENT STATUS above.)

Priority for phase 1 is simply transferring everything from Sam's Notion
into this portal and getting it working perfectly, so he can smoothly
move clients off Notion. Fancy new features come AFTER the core is solid.

---

## CLIENT PORTAL — sections (mostly mirrors current Notion)
- Home / dashboard with announcements pinned at top
- Onboarding flow (see below) — gates access on first login
- Onboarding process videos (Sam to supply)
- Support guides
- Webinars (recorded sessions Sam has done)
- Training clips area
- Posing area
- Recommendations area (gym bag, supplements, shopping, daily non-negotiables)
- Mindset area
- Coach messages (announcements / reminders pushed from Sam)
- Referral system — unique referral link per client, tracked
- Social / meal tracker (see below)
- Community tab (see below)

## COACH BACKEND — sections
- Overview dashboard (client stats, status of each client)
- Client roster — click into any client (e.g. Luke) to see their detail,
  including whether they've logged their social/meal tracker
- Announcements publisher — push to all clients at once
- Check-in reminders — pushed to clients so Sam doesn't have to manually
- Messages — send to individual clients or broadcast
- Revenue tracking — track all revenue, plus reminders for invoices
- Content manager — upload/edit/remove videos, guides, webinars
- Community event manager — add/edit events on the community calendar
- (Future) health scoring, churn alerts, referral leaderboard, analytics,
  private coach notes, revenue forecast

---

## KEY NEW DECISIONS (from portal onboarding call, May 23)

### Social / meal tracker
Sam built a separate offline social/meal tracker. He'll send it to Dylan
to REBUILD into the portal. Unlike his current version (where he can't see
what clients input), this must be mapped PER CLIENT so Sam can click into a
client and see if they logged. This means some real client-entered data
lives in the portal. It does NOT replace 1fit/Kahunas — clients may still
transfer data there — but having it here makes the portal more interactive
and lets Sam actually see engagement.

### Community tab
New section Sam specifically requested. A calendar/list of all community
events — team calls, client meetups, photoshoots, anything community-related.
Should support EMAIL REMINDERS before events (e.g. "live team call today
6pm") since clients may not see the WhatsApp group while at work.

### Onboarding flow (concrete)
When someone pays they go to a separate page and CANNOT log in straight
away. They must complete onboarding first:
1. Complete Sam's shared Google doc form (make their own copy, fill, send back)
2. Accept Google Sheets invite
3. Complete the welcome pack
4. Sign and date and send back
Videos/docs in the flow CANNOT be skipped — must be watched/read fully.
When complete, Sam gets an email ("Jack completed onboarding, login now
granted") and the client is granted their login. Ideally auto-joins the
WhatsApp community group at the end. Sam wants this kept CONCISE — no more
steps than he already has. He recently condensed his onboarding and wants
to keep it tight.

### Announcements / reminders
Push announcements and check-in reminders to all clients from the coach
side. WhatsApp stays the main 1-to-1 channel — do NOT try to replace it,
that adds friction. The portal complements it.

### Engagement is the #1 priority
Both agree the resources and value already exist — the hard part is getting
clients to actually open and use the portal. Every feature decision should
be weighed against "will clients actually use this and does it benefit them."
Don't add features for the sake of it.

---

## Design notes
- Fonts: DM Sans (body), DM Serif Display (headings)
- Brand: black + SS Sustain green, dark mode default with light/dark toggle
- Match the SS Sustain logo, fonts and styling from the landing page so
  the portal and website feel coherent

## Note
This is the working brief and will keep evolving as Sam sends ideas. Treat
it as the source of truth. Ask before making big assumptions.
