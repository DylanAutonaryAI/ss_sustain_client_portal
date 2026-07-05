import { createAdminClient } from '@/lib/supabase/server';

// Fixed-window rate limiter backed by the rate_limits table (service-role only).
// Returns true if the action is ALLOWED, false if the caller is over the limit.
//
// FAIL-OPEN by design: any error (DB blip, missing table) returns true so a
// limiter fault can never lock legitimate users out — it only ever *reduces*
// abuse, never blocks normal use. Best-effort under high concurrency (a few
// requests can slip past a boundary); that's fine for the threats it guards
// (denial-of-wallet on the AI endpoint, referral/reset spam).
export async function rateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const admin = await createAdminClient();
    const now = Date.now();
    const { data } = await admin
      .from('rate_limits')
      .select('count, window_start')
      .eq('bucket', bucket)
      .maybeSingle();

    if (!data) {
      await admin.from('rate_limits').upsert({ bucket, count: 1, window_start: new Date(now).toISOString() });
      return true;
    }
    const elapsed = now - new Date(data.window_start).getTime();
    if (elapsed > windowSeconds * 1000) {
      // Window expired → reset.
      await admin.from('rate_limits').update({ count: 1, window_start: new Date(now).toISOString() }).eq('bucket', bucket);
      return true;
    }
    if (data.count >= max) return false; // over the limit
    await admin.from('rate_limits').update({ count: data.count + 1 }).eq('bucket', bucket);
    return true;
  } catch {
    return true; // fail-open
  }
}
