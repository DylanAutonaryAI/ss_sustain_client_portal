import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral';
import { notifyCoach, coachEmail } from '@/lib/coach-notify';

// Stripe webhook — turns a purchase into a fully-onboarding client on Sam's
// roster, keeps next_payment_date fresh on each renewal, and auto-cancels the
// client when Stripe gives up on a subscription.
//
// Pipeline:
//   checkout.session.completed   → create client, AUTO-INVITE (send portal invite
//                                  + grant access), flag onboarding_required, and
//                                  email Sam. Handles BOTH subscription checkouts
//                                  (1-2-1 coaching) and ONE-OFF payments (e.g. The
//                                  Shred Code) — both get the full onboarding flow;
//                                  only subscriptions track billing/MRR. (Decision
//                                  2026-07-06: fully automatic — the in-portal
//                                  onboarding IS the gate, no manual grant.)
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
  // Handle BOTH subscription checkouts (1-2-1 coaching) and ONE-OFF payments
  // (e.g. "The Shred Code"). Both create a portal client, auto-invite them, put
  // them through the full onboarding flow, and email Sam. Subscriptions ALSO
  // track billing (per-payment amount, interval, next payment date → MRR);
  // one-offs don't (no recurring). Anything else (setup intents, unpaid) is
  // ignored with a clean 200.
  //
  // NOTE: every one-off purchase is treated this way (coaching onboarding). If a
  // future one-off product should NOT create a coaching client, filter by the
  // purchased price/product id here.
  const isSubscription = session.mode === 'subscription';
  const isOneOff = session.mode === 'payment';
  if (!isSubscription && !isOneOff) return;
  if (session.payment_status !== 'paid') return;

  const email = session.customer_details?.email || session.customer_email;
  if (!email) return;
  const fullName = session.customer_details?.name?.trim() || email.split('@')[0];
  // Stripe collects phone only when the merchant enables it; E.164 when present.
  const phone = session.customer_details?.phone ?? null;

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null;
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;

  const admin = await createAdminClient();

  // Billing fields — meaningful only for subscriptions; one-offs leave them null
  // so they don't inflate MRR.
  let nextPaymentDate: string | null = null;
  let monthlyAmount: number | null = null;
  let intervalToStore = 1;
  let supported = false;

  if (isSubscription) {
    if (!subscriptionId) return;
    // Idempotency: same subscription → same client (Stripe retries).
    const { data: existing } = await admin
      .from('clients').select('id').eq('stripe_subscription_id', subscriptionId).maybeSingle();
    if (existing) return;

    // Pull the subscription for next_payment_date + the price (amount/interval).
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    nextPaymentDate = periodEndIsoDate(sub);
    const price = sub.items?.data?.[0]?.price;
    const intervalUnit = price?.recurring?.interval;           // 'month' | 'year' | ...
    const intervalCount = price?.recurring?.interval_count ?? 1;
    const billingIntervalMonths =
      intervalUnit === 'month' ? intervalCount :
      intervalUnit === 'year' ? intervalCount * 12 : null;
    supported = price?.currency === 'gbp' && billingIntervalMonths != null && [1, 3, 6, 12].includes(billingIntervalMonths);
    monthlyAmount = supported && price?.unit_amount != null ? price.unit_amount / 100 : null;
    intervalToStore = supported ? billingIntervalMonths! : 1;
  } else {
    // One-off: no subscription — key idempotency on the Checkout session id.
    const { data: existing } = await admin
      .from('clients').select('id').eq('stripe_session_id', session.id).maybeSingle();
    if (existing) return;
  }

  const coachId = await getDefaultCoachId(admin);
  if (!coachId) {
    throw new Error('No coach configured (profiles.role = coach) — cannot route new Stripe client.');
  }

  // If this person already exists on the roster as a manual/imported row (same
  // email, not yet linked to any Stripe purchase), LINK to it instead of
  // duplicating the human.
  const { data: manualRow } = await admin
    .from('clients')
    .select('id')
    .eq('coach_id', coachId)
    .ilike('email', email)
    .is('stripe_subscription_id', null)
    .is('stripe_session_id', null)
    .maybeSingle();
  if (manualRow) {
    const linkFields: Record<string, unknown> = { stripe_customer_id: customerId, status: 'Active' };
    if (isSubscription) {
      linkFields.stripe_subscription_id = subscriptionId;
      linkFields.next_payment_date = nextPaymentDate;
      // Only overwrite the rate when we derived a supported one — never null out
      // a rate the coach entered manually.
      if (supported) { linkFields.monthly_amount = monthlyAmount; linkFields.billing_interval_months = intervalToStore; }
    } else {
      linkFields.stripe_session_id = session.id;
    }
    const { error: linkErr } = await admin.from('clients').update(linkFields).eq('id', manualRow.id);
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
    // New website signup → full onboarding flow before the portal unlocks.
    onboarding_required: true,
    status: 'Active',
    next_payment_date: nextPaymentDate,      // null for one-off
    monthly_amount: monthlyAmount,           // null for one-off (not MRR)
    billing_interval_months: intervalToStore,
    notes: null,
    since: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    referral_code: generateReferralCode(fullName),
    // Auto-granted on payment — the onboarding flow (not a manual grant) is the gate.
    access_granted_at: new Date().toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,  // null for one-off
    stripe_session_id: isOneOff ? session.id : null,
  });
  if (error) throw new Error(`Failed to insert client: ${error.message}`);

  // Let Sam know someone paid (best-effort — no-ops if RESEND_API_KEY /
  // COACH_NOTIFY_EMAIL aren't set; never blocks the webhook).
  const paymentLabel = isSubscription
    ? (monthlyAmount != null ? `£${monthlyAmount} · ${intervalToStore === 1 ? 'monthly' : `every ${intervalToStore} months`}` : null)
    : (session.amount_total != null ? `£${(session.amount_total / 100).toFixed(2).replace(/\.00$/, '')} · one-off` : 'One-off purchase');
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
