import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';
import { notifyCoach, coachEmail } from '@/lib/coach-notify';

// Stripe webhook — turns a subscription purchase into a fully-onboarding client
// on Sam's roster, keeps next_payment_date fresh on each renewal, and
// auto-cancels the client when Stripe gives up on the subscription.
//
// Pipeline:
//   checkout.session.completed   → create client, AUTO-INVITE (send portal invite
//                                  + grant access), flag onboarding_required, and
//                                  email Sam. (Decision 2026-07-06: fully automatic
//                                  — the in-portal onboarding IS the gate, no manual
//                                  grant. The client sets a password and works
//                                  through onboarding before the portal unlocks.)
//   invoice.paid                 → bump next_payment_date for renewals
//   customer.subscription.deleted → flip status to 'Cancelled' + reason
//
// Idempotency: clients.stripe_subscription_id has a unique index, so Stripe's
// at-least-once delivery and aggressive retry-on-failure can't double-create
// a client. handleInvoicePaid / handleSubscriptionDeleted are write-once-style
// updates so they're naturally safe to repeat.
//
// Runs in the Node runtime (Stripe SDK + crypto signature verification) and
// returns a graceful 503 until both env vars are set — same pattern as
// /api/assistant — so deploying the route without the keys configured doesn't
// break anything.

export const runtime = 'nodejs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe(): Stripe {
  // apiVersion intentionally omitted — the SDK uses its pinned default for
  // outgoing API calls, and the webhook event payload comes in with whatever
  // version is set on the dashboard endpoint (currently 2020-08-27). The
  // fields we read (customer, subscription, period ends, billing_reason)
  // have been stable across both for years.
  return new Stripe(STRIPE_SECRET_KEY!);
}

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe is not configured yet — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing in env.' },
      { status: 503 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // The raw request body is required for signature verification — Stripe signs
  // the exact bytes, so any reformat (JSON parse + serialize) would invalidate
  // the signature. Next's App Router gives us the raw text directly.
  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Only three event types are subscribed in the dashboard, but Stripe
        // can occasionally send others (during retries, version drift, or if
        // someone adds an event in the dashboard later). Acknowledge cleanly
        // so it isn't retried forever.
        break;
    }
  } catch (err) {
    // Returning 5xx makes Stripe retry with exponential backoff (up to 3 days).
    // The unique index on stripe_subscription_id makes that safe — a retry
    // can't double-create a client.
    const msg = err instanceof Error ? err.message : 'Webhook handler error';
    console.error('[stripe webhook] handler error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AdminDb = Awaited<ReturnType<typeof createAdminClient>>;

// New clients land under the single coach configured on the account. If the
// business ever has multiple coaches selling through Stripe, we'll route based
// on the product/price ID; not needed today.
async function getDefaultCoachId(admin: AdminDb): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'coach')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

// Stripe returns period ends as Unix seconds. Different API versions put them
// in different places — top-level on the subscription (older) or on each
// subscription item (newer). Pick whichever has a value.
function periodEndIsoDate(sub: Stripe.Subscription): string | null {
  const topLevel = (sub as unknown as { current_period_end?: number }).current_period_end;
  const itemLevel = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  const ts = topLevel || itemLevel;
  if (!ts) return null;
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

// ─── Event handlers ──────────────────────────────────────────────────────────

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  // We only act on subscription checkouts. Anything else (one-off Payment
  // Links, setup intents, addons) is ignored without error — Stripe will still
  // get a 200 back.
  if (session.mode !== 'subscription') return;
  if (session.payment_status !== 'paid') return;

  const email = session.customer_details?.email || session.customer_email;
  if (!email) return;
  const fullName =
    session.customer_details?.name?.trim() ||
    email.split('@')[0];

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null;
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;
  if (!subscriptionId) return;

  const admin = await createAdminClient();

  // Idempotency check: same subscription means same client. Stripe will
  // happily resend this event during retries.
  const { data: existing } = await admin
    .from('clients')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (existing) return;

  const coachId = await getDefaultCoachId(admin);
  if (!coachId) {
    throw new Error('No coach configured (profiles.role = coach) — cannot route new Stripe client.');
  }

  // Pull the subscription so we can stamp next_payment_date. If this call
  // fails Stripe will retry the whole webhook later.
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const nextPaymentDate = periodEndIsoDate(sub);

  // Per-payment amount (installment) + billing interval from the subscription's
  // price, so MRR counts Stripe clients the same way as manually-tracked ones.
  // Supports monthly and annual GBP prices (interval_count months); anything else
  // (non-GBP, weekly, etc.) leaves the amount null → falls back to the ledger.
  const price = sub.items?.data?.[0]?.price;
  const intervalUnit = price?.recurring?.interval;           // 'month' | 'year' | ...
  const intervalCount = price?.recurring?.interval_count ?? 1;
  const billingIntervalMonths =
    intervalUnit === 'month' ? intervalCount :
    intervalUnit === 'year' ? intervalCount * 12 : null;
  const supported = price?.currency === 'gbp' && billingIntervalMonths != null && [1, 3, 6, 12].includes(billingIntervalMonths);
  const monthlyAmount = supported && price?.unit_amount != null ? price.unit_amount / 100 : null; // the installment
  const intervalToStore = supported ? billingIntervalMonths! : 1;

  // Stripe Payment Links collect phone only when the merchant enables it; when
  // present it's an E.164 string. Defensively read it either way — surfaces in
  // the roster's About block with a wa.me link if set, blank if not.
  const phone = session.customer_details?.phone ?? null;

  // If this person already exists on the roster as a manual/imported row (same
  // email, no Stripe link yet), LINK Stripe to that row instead of inserting a
  // duplicate — otherwise MRR would count the same human twice.
  const { data: manualRow } = await admin
    .from('clients')
    .select('id')
    .eq('coach_id', coachId)
    .ilike('email', email)
    .is('stripe_subscription_id', null)
    .maybeSingle();
  if (manualRow) {
    // Only overwrite the rate/interval when we actually derived one from a
    // supported price — never null out a rate the coach already entered manually.
    const rateFields = supported ? { monthly_amount: monthlyAmount, billing_interval_months: intervalToStore } : {};
    const { error: linkErr } = await admin
      .from('clients')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        next_payment_date: nextPaymentDate,
        status: 'Active',
        ...rateFields,
      })
      .eq('id', manualRow.id);
    if (linkErr) throw new Error(`Failed to link Stripe to existing client: ${linkErr.message}`);
    return;
  }

  // AUTO-INVITE the new client so they can start onboarding immediately. Send the
  // Supabase invite email; on success we get their auth user id. Non-fatal on
  // failure — we still create the roster row so the payment isn't lost, and the
  // client can use "Forgot password" to get a fresh link.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  let invitedUserId: string | null = null;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name: fullName }, redirectTo: `${siteUrl}/auth/callback` },
  );
  if (inviteError) {
    if (inviteError.message.includes('already been registered')) {
      // They already have an auth login (e.g. a returning client) — link it.
      const { data: list } = await admin.auth.admin.listUsers();
      invitedUserId = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    } else {
      console.error('[stripe webhook] invite failed (creating client anyway):', inviteError.message);
    }
  } else {
    invitedUserId = inviteData?.user?.id ?? null;
  }

  const { error } = await admin.from('clients').insert({
    user_id: invitedUserId,
    coach_id: coachId,
    full_name: fullName,
    email,
    phone,
    goal: null,
    // Brand-new signup from the website → they go through the full onboarding flow
    // (videos, questionnaire, welcome pack, booking a call) before the portal
    // unlocks. Existing/imported clients stay onboarding_required=false; the
    // manual-link path above never sets this, so a current client who later buys
    // via Stripe isn't retro-forced into it.
    onboarding_required: true,
    status: 'Active',
    next_payment_date: nextPaymentDate,
    monthly_amount: monthlyAmount,
    billing_interval_months: intervalToStore,
    notes: null,
    since: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    referral_code: generateReferralCode(fullName),
    // Auto-granted on payment — the onboarding flow (not a manual grant) is the gate.
    access_granted_at: new Date().toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  });
  if (error) throw new Error(`Failed to insert client: ${error.message}`);

  // Let Sam know someone paid (best-effort — no-ops if RESEND_API_KEY /
  // COACH_NOTIFY_EMAIL aren't set; never blocks the webhook).
  const paymentLabel =
    monthlyAmount != null
      ? `£${monthlyAmount} · ${intervalToStore === 1 ? 'monthly' : `every ${intervalToStore} months`}`
      : null;
  await notifyCoach(
    `New SS Sustain client — ${fullName}`,
    coachEmail({
      heading: 'New client just paid 🎉',
      intro: `<strong style="color:#f4f4f5;">${fullName}</strong> has paid and been added to your roster — they've been auto-invited to the portal and will now go through onboarding.`,
      rows: [
        { label: 'Name', value: fullName },
        { label: 'Email', value: email },
        ...(phone ? [{ label: 'Phone', value: phone }] : []),
        ...(paymentLabel ? [{ label: 'Payment', value: paymentLabel }] : []),
      ],
      footerNote:
        "They'll set their password and work through onboarding — welcome videos, the intake questionnaire, signing the welcome pack, and booking their call with you. Their questionnaire answers appear on their roster row (and in Submissions) once submitted.",
    }),
  );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Renewal payments. The FIRST invoice for a subscription fires alongside
  // checkout.session.completed and has billing_reason = 'subscription_create'
  // — that one is already handled above (it also stamped next_payment_date
  // from the subscription). Skip it here to avoid a redundant write race.
  if (invoice.billing_reason === 'subscription_create') return;

  const subscriptionId =
    typeof (invoice as unknown as { subscription?: string | { id: string } }).subscription === 'string'
      ? ((invoice as unknown as { subscription: string }).subscription)
      : ((invoice as unknown as { subscription?: { id: string } }).subscription?.id);
  if (!subscriptionId) return;

  // Use the line item's period.end — it's the end of the cycle this invoice
  // paid for, which is also the next payment due date.
  const lineEnd = invoice.lines?.data?.[0]?.period?.end;
  if (!lineEnd) return;
  const nextPaymentDate = new Date(lineEnd * 1000).toISOString().slice(0, 10);

  const admin = await createAdminClient();
  const { error } = await admin
    .from('clients')
    .update({ next_payment_date: nextPaymentDate })
    .eq('stripe_subscription_id', subscriptionId);
  if (error) throw new Error(`Failed to update next_payment_date: ${error.message}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  // Stripe fires this when the subscription truly ends — either the customer
  // cancelled and the period ran out, or Stripe's Smart Retries gave up on a
  // failed card (~3 weeks of attempts on default settings). Auto-cancel the
  // roster row; Sam will see the notification badge.
  const admin = await createAdminClient();
  const { error } = await admin
    .from('clients')
    .update({
      status: 'Cancelled',
      status_reason: 'Stopped paying',
    })
    .eq('stripe_subscription_id', sub.id);
  if (error) throw new Error(`Failed to mark client Cancelled: ${error.message}`);
}
