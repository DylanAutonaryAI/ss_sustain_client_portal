'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { PayTag } from '@/components/ui/Pill';
import { revenueRows, revenueStats } from '@/lib/mock-data/revenue';
import type { RevenueRow } from '@/lib/types';

export default function RevenuePage() {
  const [rows, setRows] = useState<RevenueRow[]>(revenueRows);
  const [client, setClient]   = useState('Dylan Y.');
  const [amount, setAmount]   = useState('');
  const [status, setStatus]   = useState<'Paid' | 'Due' | 'Overdue'>('Paid');
  const [added, setAdded]     = useState(false);

  const handleAdd = () => {
    const now = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        month: `${now} — ${client}`,
        clients: 1,
        mrr: `£${amount || '147'}`,
        status: status === 'Paid' ? 'Complete' : 'In progress',
      },
    ]);
    setAmount('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const inputStyle = {
    background: 'var(--bg2)',
    border: '1px solid var(--border2)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'var(--text)',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  };

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
          <StatCard label="MRR"               value={revenueStats.mrr}        changeType="up"      change={`↑ ${revenueStats.mrrChange}`}   valueColor="var(--accent-text)" />
          <StatCard label="Collected this month" value={revenueStats.collected} changeType="neutral" change={`${revenueStats.outstandingCount} outstanding`} valueColor="var(--accent-text)" />
          <StatCard label="Outstanding"       value={revenueStats.outstanding} changeType="down"    change="Chase before billing"             valueColor="var(--red)" />
          <StatCard label="YTD revenue"       value={revenueStats.ytd}         changeType="up"      change="On track for £90k"                valueColor="var(--accent-text)" />
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
              <select value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle}>
                {['Dylan Y.','James M.','Connor R.','Tom H.','Aaron K.'].map((n) => (
                  <option key={n}>{n}</option>
                ))}
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
              <select value={status} onChange={(e) => setStatus(e.target.value as 'Paid' | 'Due' | 'Overdue')} style={inputStyle}>
                <option>Paid</option><option>Due</option><option>Overdue</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white whitespace-nowrap transition-all duration-150"
              style={{ background: added ? '#0d8f3e' : 'var(--accent)' }}
              onMouseEnter={(e) => { if (!added) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
            >
              {added ? 'Added ✓' : 'Add'}
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
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Month</div><div>Clients</div><div>MRR</div><div>Status</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.id}
              className="grid items-center px-5 py-3 text-[13px] transition-colors duration-100"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                color: 'var(--text2)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div style={{ color: 'var(--text)' }}>{r.month}</div>
              <div>{r.clients}</div>
              <div style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{r.mrr}</div>
              <div><PayTag status={r.status === 'Complete' ? 'Paid' : 'Due'} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
