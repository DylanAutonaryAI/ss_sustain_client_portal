'use client';

import Topbar from '@/components/layout/Topbar';
import { useContent } from '@/context/ContentContext';

export default function MindsetPage() {
  const { mindsetTips } = useContent();

  return (
    <>
      <Topbar title="Mindset" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Mindset <em className="italic" style={{ color: 'var(--accent-text)' }}>Area</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          The mental side of the game. Use these consistently.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {mindsetTips.map((tip, i) => (
            <div
              key={tip.id}
              className="p-[26px] rounded-xl transition-colors duration-150"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
            >
              <div
                className="font-serif text-[40px] leading-none mb-3"
                style={{ color: 'var(--accent-dim)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text)' }}>{tip.title}</h3>
              <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--text2)' }}>{tip.body}</p>
            </div>
          ))}
        </div>
        {mindsetTips.length === 0 && (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No mindset tips added yet.</p>
        )}
      </div>
    </>
  );
}
