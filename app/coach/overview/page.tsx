'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import ChurnAlert from '@/components/ui/ChurnAlert';
import { StatusPill, PayTag } from '@/components/ui/Pill';
import { useClientRoster } from '@/lib/clients';
import { usePayments, computeMrr, formatGBP } from '@/lib/payments';

export default function CoachOverviewPage() {
  const router = useRouter();
  const { clients, loading } = useClientRoster();
  const { payments } = usePayments();
  const mrr = computeMrr(payments, clients);
  const recent = clients.slice(0, 4);
  const churnRisk = clients
    .filter(c => c.healthScore < 40 || c.payment === 'Overdue')
    .slice(0, 4);

  const activeCount  = clients.filter(c => c.status === 'Active').length;
  const paymentsDue  = clients.filter(c => c.payment === 'Due' || c.payment === 'Overdue').length;
  const avgMonths    = clients.length
    ? clients.reduce((sum, c) => { const m = parseInt(c.duration); return sum + (isNaN(m) ? 0 : m); }, 0) / clients.length
    : 0;

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
          <StatCard label="Active clients"      value={String(activeCount)}      change={`${clients.length} total`}                         changeType="neutral" valueColor="var(--accent-text)" />
          <StatCard label="MRR"                 value={formatGBP(mrr)}           change="Active clients × current rate"                     changeType="neutral" valueColor="var(--accent-text)" />
          <StatCard label="Payments due"        value={String(paymentsDue)}      change={paymentsDue > 0 ? 'Needs chasing' : 'All up to date'} changeType="neutral" valueColor={paymentsDue > 0 ? 'var(--red)' : 'var(--accent-text)'} />
          <StatCard label="Avg client duration" value={`${avgMonths.toFixed(1)}mo`} change="From join dates"                                 changeType="neutral" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>⚠ Churn risk alerts</span>
        </div>
        {churnRisk.map(c => (
          <ChurnAlert
            key={c.id}
            icon={c.payment === 'Overdue' ? '🔴' : '🟡'}
            title={`${c.name} — health score ${c.healthScore}`}
            body={`${c.payment === 'Overdue' ? 'Payment overdue. ' : c.payment === 'Due' ? 'Payment due soon. ' : ''}Last activity: ${c.lastLogin === 'Never' ? 'never logged in' : c.lastLogin.toLowerCase()}. Worth a check-in.`}
          />
        ))}
        {!loading && churnRisk.length === 0 && (
          <div
            className="px-[18px] py-3.5 mb-2 rounded-[10px] text-[13px]"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', color: 'var(--accent-text)' }}
          >
            ✓ No churn risks right now — everyone&apos;s active and paid up.
          </div>
        )}

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
              className="grid items-center px-5 py-3 cursor-pointer transition-colors duration-100"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => router.push(`/coach/clients?open=${encodeURIComponent(c.id)}`)}
              title={`Open ${c.name}'s profile`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 overflow-hidden"
                  style={{ background: c.avatarUrl ? 'transparent' : 'var(--accent)' }}
                >
                  {c.avatarUrl ? (
                    <Image src={c.avatarUrl} alt={c.name} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    c.initials
                  )}
                </div>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {c.name}
                    {c.nickname && (
                      <span style={{ color: 'var(--text3)', fontWeight: 400 }}> · &ldquo;{c.nickname}&rdquo;</span>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{c.since}</div>
                </div>
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.goal}</div>
              <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.duration}</div>
              <div><StatusPill status={c.status} /></div>
              <div><PayTag status={c.payment} /></div>
            </div>
          ))}
          {loading && (
            <div className="px-5 py-7 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              Loading clients…
            </div>
          )}
          {!loading && recent.length === 0 && (
            <div className="px-5 py-7 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              No clients yet. Add your first one from the Client Roster.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
