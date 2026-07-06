import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Serves the welcome pack with the client's e-signature stamped onto it. The
// signature is generated ON DEMAND from the stored name + date (clients
// .welcome_pack_signed_*), so there's nothing to store and it's always current.
//
// Access:
//   ?clientId=<id>  → COACH viewing a specific client's signed pack (coach-only,
//                     scoped to their own clients).
//   (no param)      → the signed-in CLIENT viewing their own.
// Unsigned clients get the plain pack back (so the link never breaks).
export const runtime = 'nodejs';

// Load the base pack: try the bundled file first, then fetch over HTTP (Vercel
// doesn't always include /public in the function bundle).
async function loadBasePack(): Promise<Uint8Array | null> {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const p = path.join(process.cwd(), 'public', 'assets', 'welcome-pack.pdf');
    return new Uint8Array(await fs.readFile(p));
  } catch { /* fall through to HTTP */ }
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const res = await fetch(`${siteUrl}/assets/welcome-pack.pdf`, { cache: 'no-store' });
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
  } catch { /* give up */ }
  return null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const clientId = new URL(request.url).searchParams.get('clientId');

  let client:
    | { full_name: string | null; email: string | null; welcome_pack_signed_name: string | null; welcome_pack_signed_at: string | null }
    | null = null;

  if (clientId) {
    const { data: role } = await supabase.rpc('get_my_role');
    if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { data } = await admin
      .from('clients')
      .select('full_name, email, welcome_pack_signed_name, welcome_pack_signed_at')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .maybeSingle();
    client = data;
  } else {
    const { data } = await admin
      .from('clients')
      .select('full_name, email, welcome_pack_signed_name, welcome_pack_signed_at')
      .eq('user_id', user.id)
      .maybeSingle();
    client = data;
  }
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const base = await loadBasePack();
  if (!base) return NextResponse.json({ error: 'Welcome pack unavailable' }, { status: 502 });

  const pdfDoc = await PDFDocument.load(base);

  // Append a clean signature page when the client has signed.
  if (client.welcome_pack_signed_name) {
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const green = rgb(0.125, 0.714, 0.137); // SS Sustain #20B623
    const dark = rgb(0.1, 0.1, 0.11);
    const grey = rgb(0.42, 0.42, 0.46);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const signedDate = client.welcome_pack_signed_at
      ? new Date(client.welcome_pack_signed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: green });

    let y = height - 110;
    page.drawText('Electronic Signature', { x: 60, y, size: 26, font: bold, color: dark });
    y -= 26;
    page.drawText('SS Sustain — Coaching Welcome Pack', { x: 60, y, size: 12, font: helv, color: grey });

    y -= 70;
    page.drawText('This welcome pack was read and signed via the SS Sustain client portal.', { x: 60, y, size: 12, font: helv, color: dark });

    y -= 64;
    page.drawText('SIGNED BY', { x: 60, y, size: 10, font: bold, color: grey });
    y -= 34;
    page.drawText(client.welcome_pack_signed_name, { x: 60, y, size: 26, font: italic, color: dark });
    y -= 14;
    page.drawLine({ start: { x: 60, y }, end: { x: 380, y }, thickness: 1, color: grey });

    y -= 42;
    page.drawText('DATE', { x: 60, y, size: 10, font: bold, color: grey });
    y -= 24;
    page.drawText(signedDate, { x: 60, y, size: 15, font: helv, color: dark });

    if (client.email) {
      y -= 44;
      page.drawText(`Account: ${client.email}`, { x: 60, y, size: 10, font: helv, color: grey });
    }
  }

  const out = await pdfDoc.save();
  const safeName = (client.full_name || 'client').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'client';
  return new NextResponse(Buffer.from(out), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="welcome-pack-${safeName}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
