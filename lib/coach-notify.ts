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

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// Branded SS Sustain email shell for coach notifications — dark theme, logo,
// green accent + a details table and a CTA button. Reusable for any coach alert
// (new payment, onboarding complete, …). Pass raw strings; they're HTML-escaped.
export function coachEmail(opts: {
  heading: string;
  intro: string;
  rows?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  footerNote?: string;
}): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://app.sssustain.com').replace(/\/+$/, '');
  const cta = opts.cta ?? { label: 'Open your roster', url: `${site}/coach/clients` };
  const rows = (opts.rows ?? [])
    .map(
      (r) => `
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8a8a92;vertical-align:top;white-space:nowrap;padding-right:18px;">${esc(r.label)}</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#f4f4f5;">${esc(r.value)}</td>
        </tr>`,
    )
    .join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0c0e;margin:0;padding:0;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#1c1c20;border-radius:16px;border:1px solid #2a2a30;">
      <tr><td align="center" style="padding:32px 40px 4px 40px;">
        <img src="${site}/applogo.png" width="46" height="46" alt="SS Sustain" style="display:block;border:0;border-radius:11px;" />
        <div style="font-family:Georgia,serif;font-size:18px;color:#f4f4f5;margin-top:10px;">SS Sustain</div>
      </td></tr>
      <tr><td style="padding:20px 40px 4px 40px;">
        <h1 style="font-family:Georgia,serif;font-size:23px;line-height:1.25;color:#ffffff;margin:0 0 12px 0;font-weight:normal;">${esc(opts.heading)}</h1>
        <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#c9c9cf;margin:0;">${opts.intro}</p>
      </td></tr>
      ${rows ? `<tr><td style="padding:14px 40px 6px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a30;border-bottom:1px solid #2a2a30;">${rows}</table>
      </td></tr>` : ''}
      <tr><td align="center" style="padding:20px 40px 8px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td align="center" bgcolor="#20B623" style="border-radius:9px;">
            <a href="${cta.url}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:9px;">${esc(cta.label)} &rarr;</a>
          </td>
        </tr></table>
      </td></tr>
      ${opts.footerNote ? `<tr><td style="padding:16px 40px 32px 40px;">
        <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#8a8a92;margin:0;">${opts.footerNote}</p>
      </td></tr>` : `<tr><td style="height:24px;"></td></tr>`}
    </table>
  </td></tr>
</table>`;
}
