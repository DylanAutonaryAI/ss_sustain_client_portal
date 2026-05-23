import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';

const sectionVisits = [
  { label: 'Training Clips',  pct: 88 },
  { label: 'Supplements',     pct: 74 },
  { label: 'Mindset',         pct: 61 },
  { label: 'Webinars',        pct: 52 },
  { label: 'Resource Library',pct: 39 },
  { label: 'Posing Area',     pct: 28 },
];

const keyMetrics = [
  { label: 'Avg logins per client / month',  value: '4.2',  green: true  },
  { label: 'Clients who read coach messages',value: '94%',  green: true  },
  { label: 'Referral link copy rate',        value: '28%',  green: false },
  { label: 'Referral conversion rate',       value: '7.9%', green: true  },
  { label: 'Clients inactive 14+ days',      value: '6',    amber: true  },
  { label: 'Landing page → portal conversion',value:'3.1%', green: true  },
];

export default function AnalyticsPage() {
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

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Logins this month"   value="284" valueColor="var(--accent-text)" changeType="up"      change="↑ +22% vs last month" />
          <StatCard label="Active users (7d)"   value="51"  changeType="neutral" change="of 67 clients" />
          <StatCard label="Referral clicks"     value="38"  changeType="up"      change="↑ 3 conversions" />
          <StatCard label="Inactive (14d+)"     value="6"   valueColor="var(--amber)" changeType="neutral" change="Re-engagement email sent" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Bar chart */}
          <div
            className="rounded-xl p-[22px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-[13px] font-medium mb-4" style={{ color: 'var(--text2)' }}>Most visited sections</h3>
            {sectionVisits.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 mb-2.5">
                <span className="text-[12px] w-[110px] flex-shrink-0" style={{ color: 'var(--text2)' }}>{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, background: 'var(--accent)' }}
                  />
                </div>
                <span className="text-[12px] font-medium w-8 text-right" style={{ color: 'var(--text)' }}>{s.pct}%</span>
              </div>
            ))}
          </div>

          {/* Key metrics */}
          <div
            className="rounded-xl p-[22px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-[13px] font-medium mb-4" style={{ color: 'var(--text2)' }}>Key metrics</h3>
            {keyMetrics.map((m, i) => (
              <div
                key={m.label}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < keyMetrics.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{m.label}</span>
                <span
                  className="text-[13px] font-medium"
                  style={{
                    color: (m as { amber?: boolean }).amber ? 'var(--amber)' : m.green ? 'var(--accent-text)' : 'var(--text)',
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
