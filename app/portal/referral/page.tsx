'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { PayTag } from '@/components/ui/Pill';

const referrals = [
  { name: 'Jake B.',          joined: 'Mar 12', status: 'Paid' as const,    label: '£20 credited' },
  { name: 'Pending referral', joined: '—',      status: 'pending' as const, label: 'Pending'      },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const refLink = 'sssustain.com/join?ref=DYLAN24';

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Topbar title="Refer a Friend" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[680px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Refer a <em className="italic" style={{ color: 'var(--accent-text)' }}>Friend</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Know someone who&apos;d benefit from SS Sustain coaching?
        </p>

        {/* Hero */}
        <div
          className="rounded-[14px] p-8 text-center mb-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--accent-mid)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="font-serif text-[36px] tracking-[-0.5px] mb-2" style={{ color: 'var(--text)' }}>
            Get <em className="italic" style={{ color: 'var(--accent-text)' }}>£20 off</em> your next month
          </div>
          <p className="text-[13px] max-w-[460px] mx-auto mb-6 leading-[1.7]" style={{ color: 'var(--text2)' }}>
            Every friend you refer who signs up gets you £20 off your next payment. No limit.
            Your link is unique — every signup is tracked automatically.
          </p>

          <div
            className="flex items-center gap-2.5 max-w-[420px] mx-auto mb-3 px-4 py-3 rounded-[9px]"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
          >
            <span className="flex-1 text-[13px] font-medium tracking-[0.2px]" style={{ color: 'var(--accent-text)' }}>
              {refLink}
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all duration-150 whitespace-nowrap"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <div className="flex gap-2 justify-center mt-3.5">
            {['Share via WhatsApp', 'Share via Instagram'].map((label) => (
              <button
                key={label}
                className="px-4 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150"
                style={{
                  border: '1px solid var(--border2)',
                  background: 'transparent',
                  color: 'var(--text2)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = 'var(--text)';
                  el.style.background = 'var(--bg3)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = 'var(--text2)';
                  el.style.background = 'transparent';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Referrals table */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Your referrals</span>
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
          {referrals.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-3 px-[18px] py-3 text-[13px] items-center"
              style={{ borderBottom: i < referrals.length - 1 ? '1px solid var(--border)' : 'none', color: r.status === 'pending' ? 'var(--text3)' : 'var(--text)' }}
            >
              <div>{r.name}</div>
              <div>{r.joined}</div>
              <div>
                {r.status === 'Paid' ? (
                  <PayTag status="Paid" />
                ) : (
                  <span
                    className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
                    style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}
                  >
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
