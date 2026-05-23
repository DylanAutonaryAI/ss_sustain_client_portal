'use client';

import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { PayTag, HealthDot } from '@/components/ui/Pill';
import { clients } from '@/lib/mock-data/clients';

export default function ClientHealthPage() {
  return (
    <>
      <Topbar title="Client Health" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Health</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Automatic scoring based on login activity, message reads, and engagement. Red needs action today.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Healthy"  value="51" valueColor="var(--accent-text)" change="Active, engaged, paid" />
          <StatCard label="At risk"  value="10" valueColor="var(--amber)"       change="Reduced activity" />
          <StatCard label="Critical" value="6"  valueColor="var(--red)"         change="Action required" />
        </div>

        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Client</div><div>Last login</div><div>Msg read</div><div>Duration</div><div>Payment</div><div>Health</div>
          </div>
          {clients.map((c, i) => {
            const loginWarning = c.lastLogin.includes('days') && parseInt(c.lastLogin) >= 7;
            return (
              <div
                key={c.id}
                className="grid items-center px-5 py-3 transition-colors duration-100"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                  borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none',
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
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{c.duration}</div>
                  </div>
                </div>
                <div className="text-[13px]" style={{ color: loginWarning ? 'var(--amber)' : 'var(--text2)' }}>
                  {c.lastLogin}
                </div>
                <div className="text-[13px]" style={{ color: c.msgRead ? 'var(--text2)' : 'var(--text3)' }}>
                  {c.msgRead ? '✓ Yes' : '✗ No'}
                </div>
                <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.duration}</div>
                <div><PayTag status={c.payment} /></div>
                <div><HealthDot score={c.healthScore} /></div>
              </div>
            );
          })}
        </div>

        <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>How scoring works</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Login in last 7 days"  value="+40 pts" valueColor="var(--accent-text)" />
          <StatCard label="Coach message read"    value="+30 pts" valueColor="var(--accent-text)" />
          <StatCard label="Payment up to date"    value="+30 pts" valueColor="var(--accent-text)" />
        </div>
      </div>
    </>
  );
}
