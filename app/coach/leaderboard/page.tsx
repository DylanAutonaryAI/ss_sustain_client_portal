'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { formatGBP } from '@/lib/payments';
import type { PayoutState, PlanType } from '@/lib/referral';

interface RankRow {
  id: string; name: string; since: string; status: string;
  referrals: number; leads: number; avatarUrl: string | null; nickname: string | null;
}
interface Lead {
  id: number; referrerName: string; name: string; email: string;
  status: string; createdAt: string; planType: PlanType | null;
  joinedAt: string | null; payoutDueAt: string | null; payoutPaidAt: string | null;
  payout: PayoutState;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#c97c3a' };

export default function ReferralsPage() {
  const [ranked, setRanked] = useState<RankRow[]>([]);
  const [referrers, setRefs] = useState(0);
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [reward, setReward] = useState(100);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<number | null>(null); // lead id choosing a plan
  const [confirmDel, setConfirmDel] = useState<number | null>(null); // lead id confirming delete
  const [busy, setBusy]       = useState<number | null>(null);

  const load = useCallback(async () => {
    const [lb, mg] = await Promise.all([
      fetch('/api/referral/leaderboard', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      fetch('/api/referral/manage', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    ]);
    if (Array.isArray(lb.ranked)) { setRanked(lb.ranked); setRefs(lb.referrers ?? 0); }
    if (Array.isArray(mg.leads)) setLeads(mg.leads);
    if (mg.reward) setReward(mg.reward);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = useCallback(async (lead_id: number, action: string, plan_type?: PlanType) => {
    setBusy(lead_id);
    await fetch('/api/referral/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, lead_id, plan_type }),
    }).catch(() => {});
    setPicking(null);
    await load();
    setBusy(null);
  }, [load]);

  // Summary across all leads
  const joined   = leads.filter(l => l.status === 'converted').length;
  const owedNow  = leads.filter(l => l.payout === 'due').length * reward;
  const upcoming = leads.filter(l => l.payout === 'pending').length * reward;
  const paidOut  = leads.filter(l => l.payout === 'paid').length * reward;

  // Action queue first: pending leads to convert, then due payouts to pay.
  const order: Record<string, number> = { due: 0, pending: 1, none: 2, paid: 3 };
  const sortedLeads = [...leads].sort((a, b) => {
    const ak = a.status === 'converted' ? a.payout : 'lead';
    const bk = b.status === 'converted' ? b.payout : 'lead';
    const rank = (k: string) => (k === 'lead' ? -1 : order[k] ?? 9);
    return rank(ak) - rank(bk) || b.createdAt.localeCompare(a.createdAt);
  });

  const top = ranked.find(r => r.referrals > 0);

  return (
    <>
      <Topbar title="Referrals" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Referral <em className="italic" style={{ color: 'var(--accent-text)' }}>Scheme</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          {formatGBP(reward)} per client who joins through a referral link. Mark a lead &ldquo;joined&rdquo; and pick their plan —
          upfront pays now, monthly pays after 3 months. The portal tracks it; you pay by transfer and tick it off.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Joined via referral" value={String(joined)} valueColor="var(--accent-text)" change={`${referrers} active referrer${referrers !== 1 ? 's' : ''}`} />
          <StatCard label="Owed now"     value={formatGBP(owedNow)}  valueColor={owedNow > 0 ? 'var(--red)' : undefined} change={owedNow > 0 ? 'Pay these out' : 'Nothing due'} changeType={owedNow > 0 ? 'down' : 'neutral'} />
          <StatCard label="Upcoming"     value={formatGBP(upcoming)} change="Held (monthly, <3mo)" />
          <StatCard label="Paid out"     value={formatGBP(paidOut)}  change="All-time" />
        </div>

        {/* Leads & payouts */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Leads &amp; payouts</span>
        </div>
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '1.4fr 1.1fr 0.9fr 1.1fr 72px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
            <div>Friend</div><div>Referred by</div><div>Status</div><div className="text-right">£100 payout</div><div></div>
          </div>

          {loading && <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</div>}
          {!loading && sortedLeads.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              No referral leads yet. Clients share their link from Refer a Friend; signups land here.
            </div>
          )}

          {sortedLeads.map((l, i) => (
            <div key={l.id} className="grid items-center px-5 py-3.5 text-[13px]"
              style={{ gridTemplateColumns: '1.4fr 1.1fr 0.9fr 1.1fr 72px', borderBottom: i < sortedLeads.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {/* Friend */}
              <div>
                <div style={{ color: 'var(--text)' }}>{l.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{l.email}</div>
              </div>
              {/* Referrer */}
              <div style={{ color: 'var(--text2)' }}>{l.referrerName}</div>
              {/* Status */}
              <div>
                {l.status === 'converted' ? (
                  <span className="text-[11px]" style={{ color: 'var(--text2)' }}>
                    Joined · <span style={{ color: 'var(--text3)' }}>{l.planType === 'upfront' ? 'upfront' : 'monthly'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
                    style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    Lead
                  </span>
                )}
              </div>
              {/* Payout / action */}
              <div className="flex items-center justify-end gap-2">
                {l.status !== 'converted' ? (
                  picking === l.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => act(l.id, 'convert', 'upfront')} disabled={busy === l.id}
                        className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-semibold text-white" style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                        Upfront
                      </button>
                      <button onClick={() => act(l.id, 'convert', 'monthly')} disabled={busy === l.id}
                        className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-semibold" style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', cursor: 'pointer' }}>
                        Monthly
                      </button>
                      <button onClick={() => setPicking(null)} className="text-[11px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setPicking(l.id)}
                      className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold" style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', cursor: 'pointer' }}>
                      Mark joined →
                    </button>
                  )
                ) : l.payout === 'paid' ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-text)' }}>{formatGBP(reward)} paid ✓</span>
                    <button onClick={() => act(l.id, 'unpay')} disabled={busy === l.id} className="text-[10px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                  </span>
                ) : l.payout === 'due' ? (
                  <button onClick={() => act(l.id, 'pay')} disabled={busy === l.id}
                    className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-white" style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                    Pay {formatGBP(reward)} →
                  </button>
                ) : (
                  <span className="text-[11px] text-right" style={{ color: 'var(--text3)' }}>
                    {formatGBP(reward)} · pays {fmtDate(l.payoutDueAt)}
                  </span>
                )}
              </div>
              {/* Delete — removes the lead and recalculates the leaderboard/payouts */}
              <div className="flex items-center justify-end">
                {confirmDel === l.id ? (
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => { setConfirmDel(null); act(l.id, 'delete'); }} disabled={busy === l.id}
                      className="text-[11px] font-semibold" style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    <button onClick={() => setConfirmDel(null)}
                      className="text-[11px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDel(l.id)} title="Delete referral"
                    className="text-[14px] leading-none transition-colors duration-150"
                    style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Leaderboard</span>
          {top && <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Top: {top.nickname || top.name.split(' ')[0]}</span>}
        </div>
        {!loading && ranked.length === 0 ? (
          <div className="px-[18px] py-8 rounded-[10px] text-center text-[13px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
            No clients yet. Add clients and share their referral links to start tracking.
          </div>
        ) : (
          ranked.map((c, i) => {
            const rank = i + 1;
            const rankColor = rankColors[rank] ?? 'var(--text3)';
            const has = c.referrals > 0;
            return (
              <div key={c.id} className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <span className="font-serif text-[22px] w-7 text-center flex-shrink-0" style={{ color: rankColor }}>{rank}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 mx-1 overflow-hidden"
                  style={{ background: c.avatarUrl ? 'transparent' : (has ? 'var(--accent)' : 'var(--bg3)'), color: has ? '#fff' : 'var(--text3)' }}>
                  {c.avatarUrl ? <Image src={c.avatarUrl} alt={c.name} width={28} height={28} className="w-full h-full object-cover" unoptimized /> : initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {c.name}{c.nickname && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> · &ldquo;{c.nickname}&rdquo;</span>}
                  </h4>
                  <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                    {c.leads} lead{c.leads !== 1 ? 's' : ''}{c.status === 'Paused' ? ' · Paused' : ''}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-serif text-[22px] leading-none" style={{ color: has ? 'var(--accent-text)' : 'var(--text3)' }}>{c.referrals}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>joined</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
