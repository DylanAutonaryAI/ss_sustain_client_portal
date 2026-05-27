'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import AnimatedStat from '@/components/ui/CountUp';
import Donut from '@/components/ui/Donut';
import { useClientRoster } from '@/lib/clients';
import { usePayments, computeMrr, formatGBP as GBP } from '@/lib/payments';
import type { PaymentStatus } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8,
  padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
};

export default function RevenuePage() {
  const { clients } = useClientRoster();
  const { payments, loading, refetch } = usePayments();

  const [clientId, setClientId] = useState('');
  const [amount, setAmount]     = useState('');
  const [status, setStatus]     = useState<PaymentStatus>('Paid');
  const [added, setAdded]       = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!clientId && clients.length > 0) setClientId(clients[0].id);
  }, [clients, clientId]);

  async function handleAdd() {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0 || !clientId) return;
    const c = clients.find(x => x.id === clientId);
    setSaving(true);
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_name: c?.name ?? 'Client', amount: amt, status }),
    }).catch(() => {});
    setAmount('');
    setSaving(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    refetch();
  }

  // ── computed stats ──────────────────────────────────────────────
  const now       = new Date();
  const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const thisYear  = String(now.getFullYear());

  const collected = payments
    .filter(p => p.status === 'Paid' && p.paid_at?.slice(0, 7) === thisMonth)
    .reduce((s, p) => s + p.amount, 0);

  const ytd = payments
    .filter(p => p.status === 'Paid' && p.paid_at?.slice(0, 4) === thisYear)
    .reduce((s, p) => s + p.amount, 0);

  const outstandingList = payments.filter(p => p.status === 'Due' || p.status === 'Overdue');
  const outstanding     = outstandingList.reduce((s, p) => s + p.amount, 0);

  const mrr = computeMrr(payments, clients);

  // Monthly breakdown of collected revenue, most recent first
  const byMonth: Record<string, { total: number; count: number }> = {};
  for (const p of payments) {
    if (p.status !== 'Paid' || !p.paid_at) continue;
    const key = p.paid_at.slice(0, 7);
    (byMonth[key] ??= { total: 0, count: 0 });
    byMonth[key].total += p.amount;
    byMonth[key].count += 1;
  }
  const months = Object.entries(byMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, v]) => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
      return { key, label, total: v.total, count: v.count, isCurrent: key === thisMonth };
    });

  return (
    <>
      <Topbar title="Revenue" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Revenue <em className="italic" style={{ color: 'var(--accent-text)' }}>Overview</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Monthly recurring revenue, payments and trends.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="MRR"                  value={GBP(mrr)}         changeType="neutral" change="Active clients × current rate"          valueColor="var(--accent-text)" />
          <StatCard label="Collected this month" value={GBP(collected)}   changeType="neutral" change={`${outstandingList.length} outstanding`} valueColor="var(--accent-text)" />
          <StatCard label="Outstanding"          value={GBP(outstanding)} changeType={outstanding > 0 ? 'down' : 'neutral'} change={outstanding > 0 ? 'Chase before billing' : 'Nothing outstanding'} valueColor={outstanding > 0 ? 'var(--red)' : 'var(--accent-text)'} />
          <StatCard label="YTD revenue"          value={GBP(ytd)}         changeType="neutral" change={`${thisYear} to date`}                  valueColor="var(--accent-text)" />
        </div>

        {/* Cash position — collected vs outstanding donut */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Cash position</span>
        </div>
        <div
          className="rounded-xl p-6 mb-6 flex items-center gap-8 flex-wrap"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <Donut segments={[{ value: collected, color: 'var(--accent)' }, { value: outstanding, color: 'var(--amber)' }]}>
            {collected + outstanding > 0 ? (
              <>
                <span className="font-serif text-[24px] leading-none" style={{ color: 'var(--text)' }}>
                  <AnimatedStat text={`${Math.round((collected / (collected + outstanding)) * 100)}%`} />
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-[0.6px]" style={{ color: 'var(--text3)' }}>collected</span>
              </>
            ) : (
              <span className="text-[11px] px-3" style={{ color: 'var(--text3)' }}>No revenue yet</span>
            )}
          </Donut>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Collected this month</span>
              </div>
              <div className="font-serif text-[20px] mt-0.5" style={{ color: 'var(--accent-text)' }}>
                <AnimatedStat text={GBP(collected)} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--amber)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Outstanding (owed)</span>
              </div>
              <div className="font-serif text-[20px] mt-0.5" style={{ color: outstanding > 0 ? 'var(--amber)' : 'var(--text)' }}>
                <AnimatedStat text={GBP(outstanding)} />
              </div>
            </div>
            <p className="text-[11px] max-w-[280px] leading-relaxed" style={{ color: 'var(--text3)' }}>
              How much of your billed revenue is in the bank versus still owed.
            </p>
          </div>
        </div>

        {/* Add payment */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Add payment</span>
        </div>
        <div
          className="rounded-xl p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="grid gap-2.5 items-end" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
                {clients.length === 0 && <option value="">No clients yet</option>}
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Amount (£)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="147"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} style={inputStyle}>
                <option>Paid</option><option>Due</option><option>Overdue</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !clientId || !amount}
              className="px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white whitespace-nowrap transition-all duration-150 disabled:opacity-60"
              style={{ background: added ? '#0d8f3e' : 'var(--accent)', border: 'none', cursor: saving || !clientId || !amount ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!added && !saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
            >
              {added ? 'Added ✓' : saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Monthly breakdown</span>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '2fr 1fr 1fr', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Month</div><div>Payments</div><div>Collected</div>
          </div>
          {months.map((r, i) => (
            <div
              key={r.key}
              className="grid items-center px-5 py-3 text-[13px] transition-colors duration-100"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr',
                borderBottom: i < months.length - 1 ? '1px solid var(--border)' : 'none',
                color: 'var(--text2)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--text)' }}>
                {r.label}
                {r.isCurrent && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}
                  >
                    This month
                  </span>
                )}
              </div>
              <div>{r.count}</div>
              <div style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{GBP(r.total)}</div>
            </div>
          ))}
          {loading && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading payments…</div>
          )}
          {!loading && months.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              No payments logged yet. Add your first one above.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
