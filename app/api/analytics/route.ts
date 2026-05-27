import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { TRACKED_SECTIONS } from '@/lib/sections';

// Coach-only: real portal analytics, all computed server-side from raw data
// (clients.last_login, page_views, referral_leads, community_events/event_rsvps).
// Scoped to the caller's own clients via coach_id, like the leaderboard route.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: role } = await supabase.rpc('get_my_role');
  if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = await createAdminClient();
  const coachId = user.id;

  // ── pull everything in parallel, scoped to this coach ──────────────────────
  const [clientsRes, viewsRes, eventsRes, rsvpsRes] = await Promise.all([
    admin.from('clients').select('id, user_id, full_name, last_login').eq('coach_id', coachId),
    admin.from('page_views').select('user_id, section, viewed_at').eq('coach_id', coachId),
    admin.from('community_events').select('id, date, title').eq('coach_id', coachId),
    admin.from('event_rsvps').select('status').eq('coach_id', coachId),
  ]);

  const clients = clientsRes.data ?? [];
  const totalClients = clients.length;

  // ── login activity buckets (engagement = the #1 priority) ──────────────────
  const now = Date.now();
  const days = (iso: string | null) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return isNaN(t) ? null : Math.floor((now - t) / 86_400_000);
  };

  let withLogin = 0, activeToday = 0, active7d = 0, active30d = 0, inactive14plus = 0;
  for (const c of clients) {
    const d = days(c.last_login);
    if (d === null) continue;
    withLogin += 1;
    if (d <= 1) activeToday += 1;
    if (d <= 7) active7d += 1;
    if (d <= 30) active30d += 1;
    if (d > 14) inactive14plus += 1;
  }
  const neverLoggedIn = totalClients - withLogin;
  const activationRate = totalClients ? Math.round((withLogin / totalClients) * 100) : 0;

  // ── section reach + views (only count rows from current clients) ───────────
  const validUserIds = new Set(clients.map(c => c.user_id).filter(Boolean) as string[]);
  const cutoff30 = now - 30 * 86_400_000;
  const reachSets: Record<string, Set<string>> = {};   // all-time distinct clients
  const reach30Sets: Record<string, Set<string>> = {}; // distinct clients in the last 30 days
  const viewCounts: Record<string, number> = {};
  for (const v of viewsRes.data ?? []) {
    if (!v.section || !v.user_id || !validUserIds.has(v.user_id)) continue;
    (reachSets[v.section] ??= new Set()).add(v.user_id);
    viewCounts[v.section] = (viewCounts[v.section] ?? 0) + 1;
    if (v.viewed_at && new Date(v.viewed_at).getTime() >= cutoff30) {
      (reach30Sets[v.section] ??= new Set()).add(v.user_id);
    }
  }
  const sections = TRACKED_SECTIONS
    .map(({ key, label }) => {
      const reach = reachSets[key]?.size ?? 0;
      const reach30 = reach30Sets[key]?.size ?? 0;
      const views = viewCounts[key] ?? 0;
      const pct = withLogin ? Math.round((reach / withLogin) * 100) : 0;
      const pct30 = withLogin ? Math.round((reach30 / withLogin) * 100) : 0;
      return { key, label, reach, views, pct, reach30, pct30 };
    })
    .sort((a, b) => b.reach - a.reach || b.views - a.views);

  // ── referrals (real, from referral_leads) ──────────────────────────────────
  const clientIds = clients.map(c => c.id);
  const counts: Record<string, number> = {};
  if (clientIds.length) {
    const { data: leads } = await admin
      .from('referral_leads')
      .select('referrer_id')
      .in('referrer_id', clientIds);
    for (const l of leads ?? []) {
      if (l.referrer_id) counts[l.referrer_id] = (counts[l.referrer_id] ?? 0) + 1;
    }
  }
  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);
  const referrers = Object.values(counts).filter(n => n > 0).length;
  let topName: string | null = null, topCount = 0;
  for (const [id, n] of Object.entries(counts)) {
    if (n > topCount) { topCount = n; topName = clients.find(c => c.id === id)?.full_name ?? null; }
  }

  // ── community engagement (real) ─────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const events = (eventsRes.data ?? []).filter(e => e.date);
  const upcomingEvents = events
    .filter(e => (e.date as string) >= today)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));
  const attendingTotal = (rsvpsRes.data ?? []).filter(r => r.status === 'attending').length;

  return NextResponse.json({
    totalClients, withLogin, neverLoggedIn,
    activeToday, active7d, active30d, inactive14plus, activationRate,
    sections,
    referrals: { totalLeads, referrers, topName, topCount },
    community: {
      upcoming: upcomingEvents.length,
      attendingTotal,
      nextTitle: upcomingEvents[0]?.title ?? null,
      nextDate: upcomingEvents[0]?.date ?? null,
    },
  });
}
