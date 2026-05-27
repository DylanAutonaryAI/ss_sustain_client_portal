'use client';

import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import AnimatedStat from '@/components/ui/CountUp';
import { useClientRoster } from '@/lib/clients';
import { usePayments, computeMrr, formatGBP } from '@/lib/payments';

export default function ForecastPage() {
  const { clients } = useClientRoster();
  const { payments } = usePayments();

  const mrr             = computeMrr(payments, clients);
  const activeCount     = clients.filter(c => c.status === 'Active').length;
  const avgPerClient    = activeCount > 0 ? mrr / activeCount : 0;
  const projectedAnnual = mrr * 12;

  const now = new Date();
  const months = [0, 1, 2].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      label: d.toLocaleString('en-GB', { month: 'long' }),
      mrr,
      clients: activeCount,
      current: offset === 0,
    };
  });

  return (
    <>
      <Topbar title="Revenue Forecast" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Revenue <em className="italic" style={{ color: 'var(--accent-text)' }}>Forecast</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Projected from your current MRR and active clients, at today&apos;s run rate.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Current MRR"               value={formatGBP(mrr)}             changeType="neutral" change={`${activeCount} active × ${formatGBP(avgPerClient)} avg`} valueColor="var(--accent-text)" />
          <StatCard label="Projected annual revenue"  value={formatGBP(projectedAnnual)} changeType="neutral" change="At current run rate"                                     valueColor="var(--accent-text)" />
        </div>

        {/* 3-month projection */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text2)' }}>
            3-month projection — at current run rate (assumes clients stay steady)
          </p>
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {months.map((m) => (
              <div
                key={m.label}
                className="rounded-[9px] p-3.5 text-center"
                style={
                  m.current
                    ? { background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }
                    : { background: 'var(--bg2)', border: '1px solid var(--border)' }
                }
              >
                <div className="text-[11px] mb-1.5" style={{ color: m.current ? 'var(--accent-text)' : 'var(--text3)' }}>
                  {m.label}
                </div>
                <div className="font-serif text-[24px] leading-none mb-1" style={{ color: 'var(--accent-text)' }}>
                  <AnimatedStat text={formatGBP(m.mrr)} />
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{m.clients} client{m.clients !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mb-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>What moves the needle</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Each new client adds"    value={`${formatGBP(avgPerClient)}/mo`} valueColor="var(--accent-text)" change="recurring, at your average rate" />
          <StatCard label="Annual value per client" value={formatGBP(avgPerClient * 12)}    valueColor="var(--accent-text)" change="over 12 months" />
          <StatCard label="Losing one client costs" value={formatGBP(avgPerClient * 12)}    valueColor="var(--red)"         change="per year at current rate" />
        </div>

        {mrr === 0 && (
          <p className="text-[12px] mt-4" style={{ color: 'var(--text3)' }}>
            Log payments on the Revenue page to populate these projections.
          </p>
        )}
      </div>
    </>
  );
}
