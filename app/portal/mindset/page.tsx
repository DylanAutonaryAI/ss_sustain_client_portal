'use client';

import Topbar from '@/components/layout/Topbar';

const mindsetCards = [
  { num: '01', title: 'Mindset Tips',         body: 'Daily mental frameworks to keep you locked in when motivation drops. Discipline over feelings, every time.' },
  { num: '02', title: 'Mindset Roadmap',      body: 'A 12-week blueprint for building an athlete\'s mindset. Week by week, habit by habit.' },
  { num: '03', title: 'Identity Work',        body: 'Stop thinking like someone who wants to get fit. Start thinking like an athlete. This section rewires how you see yourself.' },
  { num: '04', title: 'Pressure Management', body: 'Social events, work stress, bad weeks — tools for handling the real world without derailing your progress.' },
];

export default function MindsetPage() {
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
          {mindsetCards.map((card) => (
            <div
              key={card.num}
              className="p-[26px] rounded-xl cursor-pointer transition-colors duration-150"
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
                {card.num}
              </div>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text)' }}>{card.title}</h3>
              <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--text2)' }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
