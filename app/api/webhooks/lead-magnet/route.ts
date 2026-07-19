import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// Public webhook — the website lead-magnet form POSTs signups here. No auth
// (runs with the service role). Hardened:
//   • per-IP rate limit,
//   • optional shared secret (LEAD_MAGNET_WEBHOOK_SECRET) matched from a header,
//     ?key= query, or body — enable it once we confirm how the form sends it,
//   • email validation,
//   • the FULL raw payload is stored, so we can see exactly what the form sends
//     and tighten the field mapping without guessing.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET = process.env.LEAD_MAGNET_WEBHOOK_SECRET;

// Normalise a key: lowercase + strip spaces/underscores/hyphens.
// "First name" -> "firstname", "Email address" -> "emailaddress".
const norm = (k: string) => k.toLowerCase().replace(/[\s_-]+/g, '');

// Find the first string value whose (normalised) key matches a candidate. Also
// looks one level deep, since some builders nest fields under data/fields/payload.
function pick(obj: Record<string, unknown>, candidates: string[]): string | null {
  for (const [k, v] of Object.entries(obj)) {
    if (candidates.includes(norm(k)) && typeof v === 'string' && v.trim()) return v.trim();
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const found = pick(v as Record<string, unknown>, candidates);
      if (found) return found;
    }
  }
  return null;
}

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return (await request.json()) as Record<string, unknown>;
    if (ct.includes('form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await request.formData();
      const obj: Record<string, unknown> = {};
      for (const [k, v] of form.entries()) obj[k] = typeof v === 'string' ? v : (v as File).name;
      return obj;
    }
    const text = await request.text();
    try { return JSON.parse(text) as Record<string, unknown>; } catch { return { _raw: text }; }
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (!(await rateLimit(`lead-magnet:${ip}`, 30, 60 * 60))) {
    return NextResponse.json({ error: 'Too many submissions.' }, { status: 429 });
  }

  const url = new URL(request.url);
  const body = await readBody(request);

  // Optional shared secret. If LEAD_MAGNET_WEBHOOK_SECRET is set, one of these
  // must match; the form can send it as a header, ?key=, or a body field.
  if (SECRET) {
    const provided =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-secret') ||
      (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
      url.searchParams.get('key') ||
      (typeof body.secret === 'string' ? body.secret : '') ||
      '';
    if (provided !== SECRET) {
      console.warn('[lead-magnet] rejected: bad/missing secret from', ip);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const email = pick(body, ['email', 'emailaddress', 'mail', 'youremail', 'emailfield']);
  const name = pick(body, ['firstname', 'name', 'fname', 'first', 'fullname', 'yourname']);
  const source = pick(body, ['source', 'form', 'formname', 'page', 'magnet']) || url.searchParams.get('source');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Log the raw shape so we can see what the form actually sent and fix the map.
    console.error('[lead-magnet] no valid email in payload:', JSON.stringify(body).slice(0, 800));
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.from('lead_magnet_leads').insert({
    name: name ?? null,
    email: email.toLowerCase(),
    source: source ?? null,
    raw: body,
  });
  if (error) {
    console.error('[lead-magnet] insert error:', error.message);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Some form builders ping the URL with a GET to validate it before saving.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'lead-magnet' });
}
