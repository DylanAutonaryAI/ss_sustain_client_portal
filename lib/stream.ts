// Cloudflare Stream helper — a thin wrapper over the Stream REST API.
//
// Client-submitted form-check clips live in Cloudflare Stream, NOT in Supabase.
// Cloudflare transcodes every upload (so an iPhone HEVC clip plays on whatever
// device/browser Sam opens on his check-in) and serves adaptive HLS, which is
// what keeps playback instant. Supabase only stores the metadata row.
//
// Two server-only env vars switch this on. Until BOTH are set, streamConfigured()
// is false and the API routes return a graceful 503 — same pattern as
// Stripe / assistant — so shipping this without the keys can't break anything.
//   CLOUDFLARE_ACCOUNT_ID        — the Cloudflare account id
//   CLOUDFLARE_STREAM_API_TOKEN  — an API token with the Stream:Edit permission

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;
const API_BASE = 'https://api.cloudflare.com/client/v4';

export function streamConfigured(): boolean {
  return !!ACCOUNT_ID && !!API_TOKEN;
}

type CfEnvelope<T> = { success: boolean; errors?: { message: string }[]; result?: T };

async function cf<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/accounts/${ACCOUNT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as CfEnvelope<T>;
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join('; ') || `Cloudflare Stream API ${res.status}`;
    throw new Error(msg);
  }
  return json.result as T;
}

// One-time direct-upload URL. The browser uploads the file straight to this URL
// (browser → Cloudflare), so it never passes through our serverless function
// (which has a ~4.5MB request-body limit). requireSignedURLs makes the video
// private — it can only be played with a signed token we mint per viewer.
export async function createDirectUpload(opts: {
  maxDurationSeconds: number;
  creator?: string;
  retentionDays: number;
  meta?: Record<string, string>;
}): Promise<{ uploadURL: string; uid: string }> {
  // scheduledDeletion must be at least 30 days out; 6-week retention (42d) is fine.
  const scheduledDeletion = new Date(Date.now() + opts.retentionDays * 86_400_000).toISOString();
  return cf<{ uploadURL: string; uid: string }>('/stream/direct_upload', {
    method: 'POST',
    body: JSON.stringify({
      maxDurationSeconds: opts.maxDurationSeconds,
      requireSignedURLs: true,
      scheduledDeletion,
      ...(opts.creator ? { creator: opts.creator } : {}),
      ...(opts.meta ? { meta: opts.meta } : {}),
    }),
  });
}

type CfVideo = {
  uid: string;
  readyToStream?: boolean;
  status?: { state?: string };
  duration?: number;
  thumbnail?: string;
  size?: number;
};

export async function getVideoStatus(uid: string): Promise<{
  state: string;
  ready: boolean;
  duration: number | null;
  thumbnail: string | null;
  size: number | null;
}> {
  const v = await cf<CfVideo>(`/stream/${uid}`);
  return {
    state: v.status?.state ?? 'unknown',
    ready: !!v.readyToStream,
    duration: typeof v.duration === 'number' && v.duration > 0 ? v.duration : null,
    thumbnail: v.thumbnail ?? null,
    size: typeof v.size === 'number' ? v.size : null,
  };
}

// A short-lived signed token for private playback, used to build the iframe URL
// the viewer watches. TTL is one check-in session by default.
export async function signPlaybackToken(uid: string, ttlSeconds = 4 * 60 * 60): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const { token } = await cf<{ token: string }>(`/stream/${uid}/token`, {
    method: 'POST',
    body: JSON.stringify({ exp }),
  });
  return token;
}

// The Cloudflare Stream iframe player handles HLS, controls, and the poster
// frame for us — no custom video element needed. Signed token → private playback.
export function iframeUrlForToken(token: string): string {
  return `https://iframe.cloudflarestream.com/${token}`;
}

// Best-effort delete — a failed Cloudflare delete must not block removing the row
// from the client's / coach's view. Callers log and continue.
export async function deleteVideo(uid: string): Promise<void> {
  await cf<unknown>(`/stream/${uid}`, { method: 'DELETE' });
}
