'use client';

import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import ChurnAlert from '@/components/ui/ChurnAlert';
import { StatusPill, PayTag } from '@/components/ui/Pill';
import { clients } from '@/lib/mock-data/clients';

export default function CoachOverviewPage() {
  const recent = clients.slice(0, 4);

  return (
    <>
      <Topbar title="Overview" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Good morning, <em className="italic" style={{ color: 'var(--accent-text)' }}>Coach.</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Here&apos;s your business at a glance.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Active clients"      value="67"    change="↑ +3 this month"       changeType="up"  valueColor="var(--accent-text)" />
          <StatCard label="MRR"                 value="£9,849" change="↑ +4.7% vs last month" changeType="up"  valueColor="var(--accent-text)" />
          <StatCard label="Payments due"        value="4"     change="Chase before Friday"    changeType="neutral" valueColor="var(--red)" />
          <StatCard label="Avg client duration" value="4.2mo" change="Retention healthy"      changeType="neutral" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>⚠ Churn risk alerts</span>
        </div>
        <ChurnAlert
          icon="🔴"
          title="Tom H. — 14 days since last login"
          body="Payment due in 3 days. No portal activity in 2 weeks. High churn risk — message him now before the billing date."
        />
        <ChurnAlert
          icon="🟡"
          title="Aaron K. — paused, 10 days inactive"
          body="Currently paused. No engagement since pausing. Risk of full cancellation — worth a check-in."
        />

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Recent clients</span>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Client</div><div>Goal</div><div>Duration</div><div>Status</div><div>Payment</div>
          </div>
          {recent.map((c, i) => (
            <div
              key={c.id}
              className="grid items-center px-5 py-3 transition-colors duration-100"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                  style={{ background: 'var(--accent)' }}
                >
                  {c.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{c.since}</div>
                </div>
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.goal}</div>
              <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.duration}</div>
              <div><StatusPill status={c.status} /></div>
              <div><PayTag status={c.payment} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
