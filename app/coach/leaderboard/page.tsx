'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';

interface Row {
  id: string;
  name: string;
  since: string;
  status: string;
  referrals: number;
  avatarUrl: string | null;
  nickname: string | null;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
}

const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#c97c3a' };

export default function LeaderboardPage() {
  const [ranked, setRanked]   = useState<Row[]>([]);
  const [total, setTotal]     = useState(0);
  const [referrers, setRefs]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referral/leaderboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.ranked)) { setRanked(d.ranked); setTotal(d.totalReferrals); setRefs(d.referrers); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top = ranked.find(r => r.referrals > 0);

  return (
    <>
      <Topbar title="Referral Leaderboard" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Referral <em className="italic" style={{ color: 'var(--accent-text)' }}>Leaderboard</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Who&apos;s driving your word-of-mouth growth. Each client has a referral link; signups through it are credited here.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total referrals"  value={String(total)} valueColor="var(--accent-text)" />
          <StatCard label="Active referrers" value={String(referrers)} />
          <StatCard label="Top referrer"     value={top ? (top.nickname || top.name.split(' ')[0]) : '—'} valueColor={top ? 'var(--accent-text)' : undefined} />
        </div>

        {loading ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</p>
        ) : ranked.length === 0 ? (
          <div className="px-[18px] py-8 rounded-[10px] text-center text-[13px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
            No clients yet. Add clients and share their referral links to start tracking.
          </div>
        ) : (
          ranked.map((c, i) => {
            const rank = i + 1;
            const rankColor = rankColors[rank] ?? 'var(--text3)';
            const has = c.referrals > 0;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <span className="font-serif text-[22px] w-7 text-center flex-shrink-0" style={{ color: rankColor }}>
                  {rank}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 mx-1 overflow-hidden"
                  style={{ background: c.avatarUrl ? 'transparent' : (has ? 'var(--accent)' : 'var(--bg3)'), color: has ? '#fff' : 'var(--text3)' }}
                >
                  {c.avatarUrl ? (
                    <Image src={c.avatarUrl} alt={c.name} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    initials(c.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {c.name}
                    {c.nickname && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> · &ldquo;{c.nickname}&rdquo;</span>}
                  </h4>
                  <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                    {c.since ? c.since.replace('Since ', 'Member since ') : 'New client'}{c.status === 'Paused' ? ' · Paused' : ''}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-serif text-[22px] leading-none" style={{ color: has ? 'var(--accent-text)' : 'var(--text3)' }}>
                    {c.referrals}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    referral{c.referrals !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
