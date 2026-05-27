// Generates a shareable referral code from a person's name plus random entropy.
// e.g. "Dylan Wright" -> "DYLANWR4F2K". The clients.referral_code unique
// constraint is the real guard; the random suffix makes collisions negligible.
export function generateReferralCode(name: string): string {
  const base = (name || 'SS').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'SS';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`;
}

// ── Referral scheme (Sam): flat £100 to the referrer per person who joins ─────
export const REFERRAL_REWARD_GBP = 100;

// Upfront 3/6/12-month plan → £100 immediately. Monthly → after 3 months.
export type PlanType = 'upfront' | 'monthly';

// A lead is 'pending' (just an enquiry) until Sam converts it. Once converted,
// the £100 is 'pending' (held until its due date), 'due' (payable now), or 'paid'.
export type PayoutState = 'none' | 'pending' | 'due' | 'paid';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// When the £100 becomes payable. Upfront pays the day they join; monthly is held
// 3 months (so an early churn means Sam simply never pays it out).
export function computePayoutDue(planType: PlanType, joinedAtISO: string): string {
  if (planType === 'upfront') return joinedAtISO;
  const d = new Date(`${joinedAtISO}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 3);
  return d.toISOString().slice(0, 10);
}

// Derive a lead's payout state from its stored fields (single source of truth so
// the coach payouts view and the referrer's portal never disagree).
export function payoutState(lead: {
  status?: string | null;
  payout_due_at?: string | null;
  payout_paid_at?: string | null;
}): PayoutState {
  if (lead.status !== 'converted') return 'none';
  if (lead.payout_paid_at) return 'paid';
  if (lead.payout_due_at && lead.payout_due_at <= todayISO()) return 'due';
  return 'pending';
}
