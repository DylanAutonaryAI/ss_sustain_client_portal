// Generates a shareable referral code from a person's name plus random entropy.
// e.g. "Dylan Wright" -> "DYLANWR4F2K". The clients.referral_code unique
// constraint is the real guard; the random suffix makes collisions negligible.
export function generateReferralCode(name: string): string {
  const base = (name || 'SS').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'SS';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`;
}
