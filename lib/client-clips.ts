import { createAdminClient } from '@/lib/supabase/server';
import { getVideoStatus, streamConfigured } from '@/lib/stream';

// Shared server-side helpers for the client-clips feature, used by both the
// client (/api/client-clips/me) and coach (/api/client-clips/coach) routes.

type AdminDb = Awaited<ReturnType<typeof createAdminClient>>;

export const RETENTION_DAYS = 42;          // ~6 weeks; matches Cloudflare scheduledDeletion
export const MAX_DURATION_SECONDS = 300;   // a form check is a single set, not a session
export const ALLOWED_MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Compound', 'Other'];

// Clips older than the retention window disappear from the UI even before
// Cloudflare physically deletes the video, so the two never look out of sync.
export function retentionCutoffISO(): string {
  return new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
}

export type ClipRow = {
  id: string;
  stream_uid: string | null;
  status: string;
  label: string | null;
  muscle: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  bytes: number | null;
  created_at: string;
  reviewed_at: string | null;
  client_id?: string;
};

export function mapClip(r: ClipRow) {
  return {
    id: r.id,
    status: r.status,
    label: r.label,
    muscle: r.muscle,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
    reviewed: !!r.reviewed_at,
  };
}

type ClipPatch = { id: string; status?: string; duration_seconds?: number | null; thumbnail_url?: string | null; bytes?: number | null };

// For any clip still 'uploading' / 'processing', ask Cloudflare whether it has
// finished transcoding; if so, promote it to 'ready' and backfill duration/size.
// Cheap: only touches non-terminal rows (just-uploaded ones), and no-ops without
// the Cloudflare keys. Returns the rows with any promotions merged in.
export async function refreshPending(admin: AdminDb, rows: ClipRow[]): Promise<ClipRow[]> {
  if (!streamConfigured()) return rows;
  const pending = rows.filter((r) => r.stream_uid && (r.status === 'uploading' || r.status === 'processing'));
  if (pending.length === 0) return rows;

  const updates = await Promise.all(
    pending.map(async (r): Promise<ClipPatch | null> => {
      try {
        const s = await getVideoStatus(r.stream_uid!);
        if (s.ready) {
          const patch = { status: 'ready', duration_seconds: s.duration, thumbnail_url: s.thumbnail, bytes: s.size };
          await admin.from('client_clips').update(patch).eq('id', r.id);
          return { id: r.id, ...patch };
        }
        if (s.state === 'error') {
          await admin.from('client_clips').update({ status: 'error' }).eq('id', r.id);
          return { id: r.id, status: 'error' };
        }
      } catch (e) {
        console.error('[client-clips] status refresh failed:', e instanceof Error ? e.message : e);
      }
      return null;
    }),
  );

  const byId = new Map(updates.filter((u): u is ClipPatch => u !== null).map((u) => [u.id, u]));
  return rows.map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id)! } : r));
}
