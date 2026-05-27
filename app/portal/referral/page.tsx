'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/layout/Topbar';
import { formatGBP } from '@/lib/payments';
import type { PayoutState } from '@/lib/referral';

interface Lead {
  name: string; email: string; status: string; created_at: string;
  planType?: string | null; payoutDueAt?: string | null; payout?: PayoutState;
}
interface Standing { name: string; referrals: number; isMe: boolean; rank: number }

const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#c97c3a' };

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export default function ReferralPage() {
  const [code, setCode]   = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [earned, setEarned]   = useState(0);
  const [pending, setPending] = useState(0);
  const [reward, setReward]   = useState(100);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [myRank, setMyRank]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch('/api/referral/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setCode(d.code ?? null);
        setLeads(Array.isArray(d.leads) ? d.leads : []);
        setEarned(d.earned ?? 0);
        setPending(d.pending ?? 0);
        if (d.reward) setReward(d.reward);
        setStandings(Array.isArray(d.standings) ? d.standings : []);
        setMyRank(d.myRank ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refLink = code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${code}`
    : '';

  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Topbar title="Refer a Friend" statusLabel="Your account" />
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-[820px]">
          <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5 text-center" style={{ color: 'var(--text)' }}>
            Refer a <em className="italic" style={{ color: 'var(--accent-text)' }}>Friend</em>
          </div>
          <p className="text-[13px] mb-7 text-center" style={{ color: 'var(--text2)' }}>
            Know someone who&apos;d benefit from SS Sustain coaching?
          </p>

          {/* Hero */}
          <div
            className="rounded-[14px] p-8 text-center mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent-mid)', boxShadow: 'var(--shadow)' }}
          >
            <div className="font-serif text-[36px] tracking-[-0.5px] mb-2" style={{ color: 'var(--text)' }}>
              Share your <em className="italic" style={{ color: 'var(--accent-text)' }}>link</em>
            </div>
            <p className="text-[13px] max-w-[460px] mx-auto mb-6 leading-[1.7]" style={{ color: 'var(--text2)' }}>
              Get <strong style={{ color: 'var(--accent-text)' }}>{formatGBP(reward)}</strong> for every friend who joins SS Sustain through your link —
              paid after 3 months if they go monthly, or straight away if they join on an upfront plan.
            </p>

            <div
              className="flex items-center gap-2.5 max-w-[460px] mx-auto mb-3 px-4 py-3 rounded-[9px]"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
            >
              <span className="flex-1 text-[13px] font-medium tracking-[0.2px] truncate" style={{ color: 'var(--accent-text)' }}>
                {loading ? 'Loading your link…' : (refLink || 'Link unavailable')}
              </span>
              <button
                onClick={handleCopy}
                disabled={!refLink}
                className="px-3.5 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all duration-150 whitespace-nowrap disabled:opacity-50"
                style={{ background: 'var(--accent)', cursor: refLink ? 'pointer' : 'default' }}
                onMouseEnter={(e) => { if (refLink) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {refLink && (
              <div className="flex gap-2 justify-center mt-3.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Check out SS Sustain coaching: ' + refLink)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150"
                  style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--text)'; el.style.background = 'var(--bg3)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--text2)'; el.style.background = 'transparent'; }}
                >
                  Share via WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent('SS Sustain coaching')}&body=${encodeURIComponent('Thought you might like this: ' + refLink)}`}
                  className="px-4 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150"
                  style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--text)'; el.style.background = 'var(--bg3)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--text2)'; el.style.background = 'transparent'; }}
                >
                  Share via Email
                </a>
              </div>
            )}
          </div>

          {/* Your rewards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-[12px] px-5 py-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="text-[11px] font-medium tracking-[0.3px] mb-1.5" style={{ color: 'var(--text3)' }}>Earned</div>
              <div className="font-serif text-[26px] leading-none" style={{ color: 'var(--accent-text)' }}>{formatGBP(earned)}</div>
              <div className="text-[11px] mt-1.5" style={{ color: 'var(--text3)' }}>Paid out to you</div>
            </div>
            <div className="rounded-[12px] px-5 py-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="text-[11px] font-medium tracking-[0.3px] mb-1.5" style={{ color: 'var(--text3)' }}>Pending</div>
              <div className="font-serif text-[26px] leading-none" style={{ color: 'var(--text)' }}>{formatGBP(pending)}</div>
              <div className="text-[11px] mt-1.5" style={{ color: 'var(--text3)' }}>On its way once they qualify</div>
            </div>
          </div>

          {/* Referrals table */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Your referrals</span>
            {!loading && <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{leads.length} total</span>}
          </div>
          <div
            className="rounded-[10px] overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="grid grid-cols-3 px-[18px] py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
              style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
            >
              <div>Name</div><div>Joined</div><div>Status</div>
            </div>
            {loading ? (
              <div className="px-[18px] py-6 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</div>
            ) : leads.length === 0 ? (
              <div className="px-[18px] py-6 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
                No referrals yet — share your link to get started.
              </div>
            ) : (
              leads.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 px-[18px] py-3 text-[13px] items-center"
                  style={{ borderBottom: i < leads.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text)' }}
                >
                  <div>{r.name}</div>
                  <div>{formatDate(r.created_at)}</div>
                  <div>
                    {r.payout === 'paid' ? (
                      <span className="text-[10px] font-bold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
                        {formatGBP(reward)} paid
                      </span>
                    ) : r.payout === 'due' ? (
                      <span className="text-[10px] font-bold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
                        {formatGBP(reward)} on the way
                      </span>
                    ) : r.payout === 'pending' ? (
                      <span className="text-[11px]" style={{ color: 'var(--text2)' }}>
                        Joined · pays {formatDate(r.payoutDueAt)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
                        style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Team leaderboard — counts only, first name + last initial */}
          <div className="flex items-center justify-between mb-3 mt-7">
            <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Team leaderboard</span>
            {myRank && <span className="text-[12px]" style={{ color: 'var(--accent-text)' }}>You&apos;re #{myRank}</span>}
          </div>
          <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            {loading ? (
              <div className="px-[18px] py-6 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</div>
            ) : standings.length === 0 ? (
              <div className="px-[18px] py-6 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
                No one&apos;s on the board yet — refer a friend to be the first 🏆
              </div>
            ) : (
              standings.map((s, i) => (
                <div
                  key={`${s.rank}-${i}`}
                  className="flex items-center gap-3 px-[18px] py-3"
                  style={{
                    borderBottom: i < standings.length - 1 ? '1px solid var(--border)' : 'none',
                    background: s.isMe ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  <span className="font-serif text-[18px] w-6 text-center flex-shrink-0" style={{ color: rankColors[s.rank] ?? 'var(--text3)' }}>
                    {s.rank}
                  </span>
                  <span className="flex-1 text-[13px]" style={{ color: 'var(--text)', fontWeight: s.isMe ? 600 : 400 }}>
                    {s.name}{s.isMe && <span style={{ color: 'var(--accent-text)', fontWeight: 400 }}> · you</span>}
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: 'var(--accent-text)' }}>
                    {s.referrals}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    joined
                  </span>
                </div>
              ))
            )}
          </div>
          {!loading && myRank === null && standings.length > 0 && (
            <p className="text-[12px] mt-2.5 text-center" style={{ color: 'var(--text3)' }}>
              Share your link to land on the board.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
