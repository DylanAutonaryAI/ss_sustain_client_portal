import type { OnboardingStep } from '@/lib/types';

// ⚠️ GLOBAL MASTER SWITCH for onboarding.
//   true (current): onboarding is decided PER CLIENT by clients.onboarding_required
//     — set via the "Show onboarding flow" checkbox in the coach's Add-client modal.
//     A client sees the flow only if their flag is true AND they haven't completed
//     it yet. Everyone else (all existing / bulk-imported clients — default false)
//     goes straight to the portal home.
//   false: hard kill switch — NO client is ever routed through onboarding, no matter
//     their per-client flag. Only for disabling the whole flow in an emergency.
export const ONBOARDING_ENABLED = true;

// TESTING MODE — only has any effect when ONBOARDING_ENABLED is true.
// When true, a CLIENT is routed through onboarding on EVERY login regardless of
// whether they've completed it, and the onboarding page shows an admin "Skip for
// now" button (a per-session bypass). When false: onboarding shows only until the
// client completes it once, and there's no skip button. Kept false so a future
// re-enable behaves as the real client gate, not the test loop.
export const ONBOARDING_TEST_MODE = false;

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
// DESIGN DECISION (2026-07-06): the portal onboarding is now the WHOLE onboarding
// for new paying clients — it REPLACES Sam's old Brevo 2-day email flow. A client
// pays on Stripe → is auto-added + auto-invited → lands here and works through
// every step (videos, the intake questionnaire, signing the welcome pack, booking
// their call, joining WhatsApp). Only then does the portal unlock. Reached only by
// clients with clients.onboarding_required = true (new signups); existing/imported
// clients (all false) never see this.

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'video',
    title: 'Welcome to SS Sustain',
    duration: '1 min',
    description: "A personal message from Coach Sam. What you've signed up for, what to expect, and how this journey works.",
    // Self-hosted mp4 (plays via a native <video>, unlike the Loom steps below).
    // Compressed web copy — the master is gitignored in public/images.
    url: '/images/welcome-video.mp4',
    note: "Heads up: you'll also get separate email invites to set up 1fit, Google Sheets and GoCardless — keep an eye on your inbox over the next few days.",
  },
  {
    id: 'portal-tour',
    type: 'video',
    title: 'How to use your portal',
    duration: '5 min',
    description: 'A quick tour of your portal — where to find your training clips, posing, supplements, webinars, recommendations and more. This is your home base, so get familiar with where everything lives.',
    url: '/images/portal-walkthrough-video.mp4',
  },
  {
    id: 'questionnaire',
    type: 'questionnaire',
    title: 'Fill out your intake questionnaire',
    description: "This is how Sam gets to know you — your goals, training, nutrition, health and lifestyle. The more detail you give, the better he can build your plan. It's all confidential and only seen by Sam.",
    confirmLabel: 'Submit questionnaire',
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
    type: 'sign',
    title: 'Sign your welcome pack',
    description: "This is your coaching agreement — Sam's already signed his side. Have a read through, then sign below to confirm you're happy and ready to get started.",
    // Static PDF served from /public/assets.
    url: '/assets/welcome-pack.pdf',
  },
  {
    id: 'book-call',
    type: 'calendly',
    title: 'Book your welcome call with Sam',
    description: "Grab a time for your welcome call. This is where you and Sam go through everything together and map out your plan. Pick whatever slot suits you best.",
    url: 'https://calendly.com/samsuttonpt_consultation-call/coaching-discovery-call',
    confirmLabel: "✓ I've booked my call",
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

// Stable keys, in order. Used server-side to validate a posted step and to
// detect when every step is done.
export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.id);
export const ONBOARDING_TOTAL = ONBOARDING_STEPS.length;
