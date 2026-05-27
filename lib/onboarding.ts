import type { OnboardingStep } from '@/lib/types';

// ⚠️ TESTING MODE — set to FALSE at go-live (and delete the admin skip button).
// When true, a CLIENT is routed through onboarding on EVERY login regardless of
// whether they've completed it, and the onboarding page shows an admin "Skip for
// now" button (a per-session bypass). This runs in PRODUCTION too — not just
// localhost — so the flow can be tested on the live site. When false: onboarding
// shows only until the client completes it once, and there's no skip button.
export const ONBOARDING_TEST_MODE = true;

// ─── Canonical onboarding steps ──────────────────────────────────────────────
//
// This is the single source of truth for the onboarding flow. Both the client
// page (app/onboarding) and the server (app/api/onboarding/me) import it.
//
// ⚠️ The `id` of each step is a STABLE KEY. It is stored in the
//    onboarding_progress table to record what a client has finished. NEVER
//    rename or reuse an id once clients may have completed it — add/remove
//    whole steps instead.
//
// 🔧 Steps with `placeholder: true` still need real content from Sam.
//
// DESIGN DECISION (2026-05-27): the portal onboarding COMPLEMENTS Sam's existing
// onboarding (Jotform application → Calendly call → Brevo 2-day email flow →
// per-client Loom video) — it doesn't re-do it. By the time a client has portal
// access, Brevo has already collected the information sheet, the welcome-pack
// sign & date, and their 1fit / Google Sheets invites. So this gate is LIGHT and
// portal-specific. The portal is REPLACING Notion, so there is deliberately no
// "accept your Notion invite" step. Keep it concise (Sam's wish).
//
// Welcome-pack signing stays in Brevo (Sam's choice). The portal carries only a
// quick confirmation "clicker" so it still counts toward the gate and shows up on
// Sam's roster as done — the actual signing/sending happens in the Brevo email.

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'video',
    title: 'Welcome to SS Sustain',
    duration: '2 min',
    description: "A personal message from Coach Sam. What you've signed up for, what to expect, and how this journey works.",
    placeholder: true, // TODO(Sam): welcome video Loom URL — Sam recording this week
  },
  {
    id: 'portal-tour',
    type: 'video',
    title: 'How to use your portal',
    duration: '3 min',
    description: 'A quick tour of your portal — where to find your training clips, posing, supplements, webinars, recommendations and more. This is your home base, so get familiar with where everything lives.',
    placeholder: true, // TODO(Sam): portal walkthrough Loom URL — Sam will record this
  },
  {
    id: 'onefit',
    type: 'video',
    title: 'Get set up on 1fit',
    duration: '3 min',
    description: "1fit is the app where everything happens — your weekly check-ins go in here, and this is where Sam sends your video and written feedback each week. A quick refresher so you're ready for your first check-in.",
    url: 'https://www.loom.com/share/99d9072bf1dd438da8ab7423002d6782',
  },
  {
    id: 'myfitnesspal',
    type: 'video',
    title: 'Track your nutrition in MyFitnessPal',
    duration: '3 min',
    description: 'MyFitnessPal is how you log your food each day, and Sam reviews your intake as part of your weekly check-in. Watch this to get it set up correctly from the start.',
    url: 'https://www.loom.com/share/035a1d6ce47c4e4e86faa5691711992e',
  },
  {
    id: 'welcome-pack',
    type: 'action',
    title: 'Sign your welcome pack',
    description: "Your welcome pack (sent to your email) is where you sign and date your coaching agreement and send it back to Sam. Once you've done that, confirm here.",
    confirmLabel: "✓ I've signed & sent it",
  },
  {
    id: 'join-community',
    type: 'action',
    title: 'Join the SS Sustain community',
    description: "Get in the WhatsApp group — team calls, meetups, wins and accountability all happen here. This is a big part of staying consistent, so don't skip it.",
    actionLabel: 'Open WhatsApp group',
    confirmLabel: "✓ I've joined",
    url: 'https://chat.whatsapp.com/EWh13rWP2jnFh7aOpY3RbD?s=cl&p=i&mlu=0',
    image: '/images/team.JPG',
  },
];

// NOTE — the check-in guide (/pdfs/check-in-process.pdf) and welcome pack
// (/pdfs/welcome-guide.pdf) PDFs still live in /public/pdfs and are surfaced
// elsewhere in the portal. The actual welcome-pack sign-&-date is done in Brevo;
// the portal step above is just the confirmation clicker.

// Stable keys, in order. Used server-side to validate a posted step and to
// detect when every step is done.
export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.id);
export const ONBOARDING_TOTAL = ONBOARDING_STEPS.length;
