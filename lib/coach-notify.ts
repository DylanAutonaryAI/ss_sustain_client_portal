// Best-effort email to the coach via Resend's HTTP API. It NO-OPS (just logs) if
// RESEND_API_KEY / COACH_NOTIFY_EMAIL aren't set, so a missing config can never
// break the caller (e.g. the Stripe webhook must still create the client even if
// the notification can't send). Resend's domain (sssustain.com) is already
// verified for the Supabase SMTP integration; this reuses that verified domain
// via the HTTP API and just needs an API key + destination address in env.
//
// Env:
//   RESEND_API_KEY      — Resend API key (server-only)
//   COACH_NOTIFY_EMAIL  — where to send coach notifications (Sam's inbox)
//   NOTIFY_FROM_EMAIL   — optional; defaults to a sssustain.com sender
export async function notifyCoach(subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.COACH_NOTIFY_EMAIL;
  const from = process.env.NOTIFY_FROM_EMAIL || 'SS Sustain <noreply@sssustain.com>';
  if (!key || !to) return; // not configured yet — skip silently
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error('[notifyCoach] non-2xx from Resend:', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.error('[notifyCoach] send failed:', e instanceof Error ? e.message : e);
  }
}
