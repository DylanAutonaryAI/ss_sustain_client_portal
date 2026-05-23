'use client';

import type { Webinar } from '@/lib/types';

export default function WebinarRow({ webinar }: { webinar: Webinar }) {
  return (
    <div
      className="flex items-center gap-[18px] px-5 py-[18px] rounded-[10px] mb-2 transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-mid)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      <div
        className="min-w-[50px] text-center px-1.5 py-2 rounded-[8px]"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
      >
        <div className="text-[9px] font-semibold uppercase tracking-[1px]" style={{ color: 'var(--accent-text)' }}>
          {webinar.month}
        </div>
        <div className="font-serif text-[24px] leading-none" style={{ color: 'var(--text)' }}>
          {webinar.day}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-medium mb-[3px]" style={{ color: 'var(--text)' }}>{webinar.title}</h3>
        <p className="text-[12px]" style={{ color: 'var(--text3)' }}>{webinar.meta}</p>
      </div>
      <button
        className="ml-auto px-4 py-[7px] rounded-[7px] text-[12px] font-medium whitespace-nowrap transition-all duration-150"
        style={{
          border: '1px solid var(--accent-mid)',
          background: 'transparent',
          color: 'var(--accent-text)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = 'var(--accent)';
          el.style.color = '#fff';
          el.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = 'transparent';
          el.style.color = 'var(--accent-text)';
          el.style.borderColor = 'var(--accent-mid)';
        }}
      >
        Register
      </button>
    </div>
  );
}
