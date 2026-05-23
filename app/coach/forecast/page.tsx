import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { revenueStats, forecastMonths } from '@/lib/mock-data/revenue';

export default function ForecastPage() {
  return (
    <>
      <Topbar title="Revenue Forecast" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Revenue <em className="italic" style={{ color: 'var(--accent-text)' }}>Forecast</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Projected MRR based on current active clients, payment dates, and historical churn rate.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Current MRR"            value={revenueStats.mrr}             changeType="up"  change={`${revenueStats.activeClients} active clients × ${revenueStats.avgPerClient}`} valueColor="var(--accent-text)" />
          <StatCard label="Projected annual revenue" value={revenueStats.projectedAnnual} changeType="up"  change="At current run rate"                                                          valueColor="var(--accent-text)" />
        </div>

        {/* 3-month projection */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text2)' }}>
            3-month projection — assumes 3% monthly churn, 5 new clients/month
          </p>
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {forecastMonths.map((m) => (
              <div
                key={m.label}
                className="rounded-[9px] p-3.5 text-center"
                style={
                  m.current
                    ? { background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }
                    : { background: 'var(--bg2)', border: '1px solid var(--border)' }
                }
              >
                <div
                  className="text-[11px] mb-1.5"
                  style={{ color: m.current ? 'var(--accent-text)' : 'var(--text3)' }}
                >
                  {m.label}
                </div>
                <div
                  className="font-serif text-[24px] leading-none mb-1"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {m.mrr}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{m.clients} clients{!m.current && ' est.'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mb-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>What moves the needle</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="If churn drops to 1%"    value="+£882/mo" valueColor="var(--accent-text)" change="by June vs current" />
          <StatCard label="Each new client adds"    value="£147/mo"  valueColor="var(--accent-text)" change="recurring every month" />
          <StatCard label="Saving 1 churned client" value="£1,764"   valueColor="var(--accent-text)" change="over 12 months" />
        </div>
      </div>
    </>
  );
}
