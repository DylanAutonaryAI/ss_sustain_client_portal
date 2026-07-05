import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Sniff the real image type from magic bytes — never trust the client-supplied
// MIME/extension. Returns the content-type, or null if it isn't a real image.
function sniffImage(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// Uploads a profile photo to the public `avatars` bucket and stores its URL on
// the profile. Runs server-side with the service role, scoped to the caller.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Validate the actual bytes, not the client-claimed type. And store at a FIXED
  // path per user so a re-upload always OVERWRITES (an attacker can't accumulate
  // distinct blobs by varying the extension), and the served content-type is the
  // real sniffed type, never attacker-controlled.
  const contentType = sniffImage(buffer);
  if (!contentType) {
    return NextResponse.json({ error: 'File must be a valid image (PNG, JPG, GIF, or WEBP).' }, { status: 400 });
  }
  const admin = await createAdminClient();
  const path = `${user.id}/avatar`;

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so a re-upload to the same path shows immediately.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ avatar_url: avatarUrl });
}
