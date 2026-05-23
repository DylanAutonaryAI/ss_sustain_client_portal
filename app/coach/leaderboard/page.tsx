import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { clients } from '@/lib/mock-data/clients';

const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#c97c3a' };

export default function LeaderboardPage() {
  const ranked = [...clients].sort((a, b) => b.referrals - a.referrals);

  return (
    <>
      <Topbar title="Referral Leaderboard" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Referral <em className="italic" style={{ color: 'var(--accent-text)' }}>Leaderboard</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Who&apos;s driving your word-of-mouth growth. Reward the top referrers, run competitions, track your best ambassadors.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total referrals this month"    value="11"    valueColor="var(--accent-text)" changeType="up"      change="↑ +4 vs last month" />
          <StatCard label="Converted to paying clients"   value="7"     valueColor="var(--accent-text)" changeType="neutral" change="63% conversion rate" />
          <StatCard label="Revenue from referrals"        value="£1,029" valueColor="var(--accent-text)" changeType="neutral" change="This month alone" />
        </div>

        {ranked.map((c, i) => {
          const rank = i + 1;
          const rankColor = rankColors[rank] ?? 'var(--text3)';
          return (
            <div
              key={c.id}
              className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <span
                className="font-serif text-[22px] w-7 text-center flex-shrink-0"
                style={{ color: rankColor }}
              >
                {rank}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 mx-1"
                style={{ background: c.referrals === 0 ? 'var(--bg3)' : 'var(--accent)', color: c.referrals === 0 ? 'var(--text3)' : '#fff' }}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</h4>
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                  {c.since.replace('Since ', 'Member since ')} · {c.duration}{c.status === 'Paused' ? ' · Paused' : ''}
                </p>
              </div>
              <div className="ml-auto text-right">
                <div
                  className="font-serif text-[22px] leading-none"
                  style={{ color: c.referrals > 0 ? 'var(--accent-text)' : 'var(--text3)' }}
                >
                  {c.referrals}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  referral{c.referrals !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
