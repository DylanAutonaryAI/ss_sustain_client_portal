'use client';

import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { HealthDot } from '@/components/ui/Pill';
import { calcPaymentStatus, daysUntilPayment, nextMonthDate } from '@/context/ClientContext';
import { useClientRoster } from '@/lib/clients';
import type { Client } from '@/lib/types';

function PayBadge({ status }: { status: 'Paid' | 'Due' | 'Overdue' }) {
  const map = {
    Paid:    { bg: 'var(--accent-dim)',           color: 'var(--accent-text)', border: 'var(--accent-mid)' },
    Due:     { bg: 'rgba(245,158,11,0.1)',        color: 'var(--amber)',       border: 'rgba(245,158,11,0.25)' },
    Overdue: { bg: 'rgba(240,79,79,0.1)',         color: 'var(--red)',         border: 'rgba(240,79,79,0.25)' },
  };
  const s = map[status];
  return (
    <span
      className="text-[10px] font-bold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

export default function ClientHealthPage() {
  const { clients, loading, refetch } = useClientRoster();

  async function markPaid(c: Client) {
    const next = nextMonthDate(c.nextPaymentDate);
    await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, next_payment_date: next }),
    });
    refetch();
  }

  // Sort: overdue first, then due, then by health score ascending
  const sorted = [...clients].sort((a, b) => {
    const order = { Overdue: 0, Due: 1, Paid: 2 };
    const pa = calcPaymentStatus(a.nextPaymentDate);
    const pb = calcPaymentStatus(b.nextPaymentDate);
    if (order[pa] !== order[pb]) return order[pa] - order[pb];
    return a.healthScore - b.healthScore;
  });

  const healthy     = clients.filter(c => c.healthScore >= 70).length;
  const atRisk      = clients.filter(c => c.healthScore >= 40 && c.healthScore < 70).length;
  const critical    = clients.filter(c => c.healthScore < 40).length;

  const overdue     = clients.filter(c => calcPaymentStatus(c.nextPaymentDate) === 'Overdue');
  const dueSoon     = clients.filter(c => calcPaymentStatus(c.nextPaymentDate) === 'Due');

  return (
    <>
      <Topbar title="Client Health" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Health</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Auto-scored from login activity and payment status. Red needs action today.
        </p>

        {/* Health summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Healthy"  value={String(healthy)}  valueColor="var(--accent-text)" change="Score 70+" />
          <StatCard label="At risk"  value={String(atRisk)}   valueColor="var(--amber)"       change="Score 40–69" />
          <StatCard label="Critical" value={String(critical)} valueColor="var(--red)"         change="Score under 40" />
        </div>

        {/* Payment alerts */}
        {(overdue.length > 0 || dueSoon.length > 0) && (
          <div className="mb-6 flex flex-col gap-2">
            {overdue.map(c => {
              const days = daysUntilPayment(c.nextPaymentDate);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[10px]"
                  style={{ background: 'rgba(240,79,79,0.07)', border: '1px solid rgba(240,79,79,0.2)' }}
                >
                  <span className="text-[13px] font-semibold flex-1" style={{ color: 'var(--red)' }}>
                    ⚠ {c.name} — payment overdue by {Math.abs(days ?? 0)} day{Math.abs(days ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Was due {c.nextPaymentDate}</span>
                  <button
                    onClick={() => markPaid(c)}
                    className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-white"
                    style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
                  >
                    Mark paid →
                  </button>
                </div>
              );
            })}
            {dueSoon.map(c => {
              const days = daysUntilPayment(c.nextPaymentDate);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[10px]"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <span className="text-[13px] font-semibold flex-1" style={{ color: 'var(--amber)' }}>
                    🕐 {c.name} — payment due {days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Due {c.nextPaymentDate}</span>
                  <button
                    onClick={() => markPaid(c)}
                    className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-white"
                    style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
                  >
                    Mark paid →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Client table */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Client</div><div>Last login</div><div>Next payment</div><div>Status</div><div>Health</div>
          </div>

          {sorted.map((c, i) => {
            const payStatus = calcPaymentStatus(c.nextPaymentDate);
            const score     = c.healthScore;
            const days      = daysUntilPayment(c.nextPaymentDate);
            const loginWarning = c.lastLogin.toLowerCase().includes('days') && parseInt(c.lastLogin) >= 7;

            return (
              <div
                key={c.id}
                className="grid items-center px-5 py-3 transition-colors duration-100"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                }}
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
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{c.duration}</div>
                  </div>
                </div>

                <div className="text-[13px]" style={{ color: loginWarning ? 'var(--amber)' : 'var(--text2)' }}>
                  {c.lastLogin}
                </div>

                <div>
                  {c.nextPaymentDate ? (
                    <div>
                      <div className="text-[12px] font-medium" style={{ color: payStatus === 'Overdue' ? 'var(--red)' : payStatus === 'Due' ? 'var(--amber)' : 'var(--text2)' }}>
                        {c.nextPaymentDate}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                        {days === null ? '' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'today' : `in ${days}d`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px]" style={{ color: 'var(--text3)' }}>—</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <PayBadge status={payStatus} />
                  {payStatus !== 'Paid' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markPaid(c); }}
                      className="text-[10px] font-semibold transition-colors duration-150"
                      style={{ color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Paid ✓
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <HealthDot score={score} />
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{score}</span>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading clients…</div>
          )}
          {!loading && sorted.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>No clients yet.</div>
          )}
        </div>

        {/* Scoring legend */}
        <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>How scoring works</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Recent portal login"  value="+50 pts" valueColor="var(--accent-text)" />
          <StatCard label="Payment up to date"   value="+50 pts" valueColor="var(--accent-text)" />
        </div>
      </div>
    </>
  );
}
