'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { useAnalytics } from '@/lib/analytics';

export default function AnalyticsPage() {
  const { data, loading, error } = useAnalytics();

  const a = data;

  // "Most visited sections" can be viewed as all-time reach or recent (last 30
  // days) engagement. The 30-day view is the churn signal — it drops when
  // clients stop opening sections; all-time only ever grows.
  const [sectionView, setSectionView] = useState<'all' | '30d'>('all');
  const recent = sectionView === '30d';
  const sortedSections = a
    ? [...a.sections].sort((x, y) =>
        recent ? y.reach30 - x.reach30 || y.reach - x.reach : y.reach - x.reach || y.views - x.views)
    : [];
  const noSectionData = !a || (recent
    ? a.sections.every(s => s.reach30 === 0)
    : a.sections.every(s => s.reach === 0));

  // Real "key metrics" derived from login activity, referrals and community.
  const keyMetrics: { label: string; value: string; tone?: 'green' | 'amber' | 'red' }[] = a
    ? [
        { label: 'Clients active today',          value: String(a.activeToday) },
        { label: 'Active in last 7 days',         value: String(a.active7d), tone: 'green' },
        { label: 'Active in last 30 days',        value: String(a.active30d) },
        { label: 'Never logged in',               value: String(a.neverLoggedIn), tone: a.neverLoggedIn > 0 ? 'amber' : undefined },
        { label: 'Inactive 14+ days',             value: String(a.inactive14plus), tone: a.inactive14plus > 0 ? 'amber' : undefined },
        { label: 'Referral leads (total)',        value: String(a.referrals.totalLeads), tone: a.referrals.totalLeads > 0 ? 'green' : undefined },
        { label: 'Clients who have referred',     value: String(a.referrals.referrers) },
        { label: 'Upcoming community events',      value: String(a.community.upcoming) },
      ]
    : [];

  return (
    <>
      <Topbar title="Analytics" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Portal <em className="italic" style={{ color: 'var(--accent-text)' }}>Analytics</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          How clients are using the portal and where they spend their time.
        </p>

        {error && (
          <div
            className="rounded-[10px] px-4 py-3 mb-6 text-[13px]"
            style={{ background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.2)', color: 'var(--red)' }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Active this week"
            value={a ? String(a.active7d) : '—'}
            valueColor="var(--accent-text)"
            changeType="neutral"
            change={a ? `of ${a.totalClients} client${a.totalClients !== 1 ? 's' : ''}` : 'Loading…'}
          />
          <StatCard
            label="Activation rate"
            value={a ? `${a.activationRate}%` : '—'}
            changeType="neutral"
            change={a ? `${a.withLogin} of ${a.totalClients} have logged in` : 'Loading…'}
          />
          <StatCard
            label="Inactive 14+ days"
            value={a ? String(a.inactive14plus) : '—'}
            valueColor={a && a.inactive14plus > 0 ? 'var(--amber)' : undefined}
            changeType="neutral"
            change={a && a.inactive14plus > 0 ? 'Worth a re-engagement nudge' : 'No one slipping'}
          />
          <StatCard
            label="Referral leads"
            value={a ? String(a.referrals.totalLeads) : '—'}
            changeType={a && a.referrals.totalLeads > 0 ? 'up' : 'neutral'}
            change={a ? `${a.referrals.referrers} client${a.referrals.referrers !== 1 ? 's' : ''} referring` : 'Loading…'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Most visited sections (real, from page_views) */}
          <div
            className="rounded-xl p-[22px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-[13px] font-medium" style={{ color: 'var(--text2)' }}>Most visited sections</h3>
              <div className="flex rounded-[7px] p-0.5 flex-shrink-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                {([['all', 'All-time'], ['30d', 'Last 30 days']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setSectionView(v)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-[5px] transition-all duration-150"
                    style={{
                      background: sectionView === v ? 'var(--accent)' : 'transparent',
                      color: sectionView === v ? '#fff' : 'var(--text3)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] mb-4" style={{ color: 'var(--text3)' }}>
              {recent
                ? 'Share of logged-in clients who’ve opened each section in the last 30 days.'
                : 'Share of logged-in clients who’ve ever opened each section.'}
            </p>

            {a && !noSectionData && sortedSections.map((s) => {
              const pct = recent ? s.pct30 : s.pct;
              return (
                <div key={s.key} className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-[12px] w-[110px] flex-shrink-0" style={{ color: 'var(--text2)' }}>{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'var(--accent)' }}
                    />
                  </div>
                  <span className="text-[12px] font-medium w-8 text-right" style={{ color: 'var(--text)' }}>{pct}%</span>
                </div>
              );
            })}

            {loading && (
              <div className="py-6 text-center text-[12px]" style={{ color: 'var(--text3)' }}>Loading…</div>
            )}
            {!loading && a && noSectionData && (
              <div className="py-6 text-center text-[12px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                {recent
                  ? <>No section visits in the last 30 days.<br />Engagement shows here as clients return.</>
                  : <>No section visits recorded yet.<br />Data fills in as clients browse the portal.</>}
              </div>
            )}
          </div>

          {/* Key metrics (real) */}
          <div
            className="rounded-xl p-[22px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-[13px] font-medium mb-4" style={{ color: 'var(--text2)' }}>Key metrics</h3>

            {loading && (
              <div className="py-6 text-center text-[12px]" style={{ color: 'var(--text3)' }}>Loading…</div>
            )}

            {a && keyMetrics.map((m, i) => (
              <div
                key={m.label}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < keyMetrics.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{m.label}</span>
                <span
                  className="text-[13px] font-medium"
                  style={{
                    color:
                      m.tone === 'amber' ? 'var(--amber)' :
                      m.tone === 'red'   ? 'var(--red)' :
                      m.tone === 'green' ? 'var(--accent-text)' :
                      'var(--text)',
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top referrer highlight (only when there's something to show) */}
        {a && a.referrals.topName && (
          <div
            className="rounded-xl px-[22px] py-4 mt-4 flex items-center gap-3"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
          >
            <span className="text-[18px]">🏆</span>
            <span className="text-[13px]" style={{ color: 'var(--text)' }}>
              Top referrer: <strong>{a.referrals.topName}</strong> — {a.referrals.topCount} lead{a.referrals.topCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
