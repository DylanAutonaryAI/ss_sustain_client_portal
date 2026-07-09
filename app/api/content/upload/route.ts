import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — PDFs run larger than avatars
const BUCKET = 'content';

// Real PDF check by magic bytes ("%PDF") — never trust the client-claimed type.
function isPdf(b: Buffer): boolean {
  return b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
}

function safeName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 60);
  return base || 'file';
}

// Coach-only: upload a PDF to the public `content` bucket and return its public
// URL, for use as a resource link in the Content Manager. Service-role upload
// (bypasses RLS); validates the real PDF bytes. Mirrors /api/profile/avatar.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'PDF must be under 25MB.' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdf(buffer)) return NextResponse.json({ error: 'File must be a PDF.' }, { status: 400 });

  const admin = await createAdminClient();

  // Ensure the public content bucket exists (idempotent — no-op if already there),
  // so the coach never needs a manual setup step to start uploading.
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* already exists */ }

  const path = `${user.id}/${Date.now()}-${safeName(file.name)}.pdf`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf', upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl, name: file.name });
}
