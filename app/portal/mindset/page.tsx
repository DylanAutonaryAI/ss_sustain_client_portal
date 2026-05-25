'use client';

import Topbar from '@/components/layout/Topbar';

const mindsetCards = [
  {
    num: '01',
    title: 'Establish Routine',
    body: 'Plan your days and weeks out. Know when you are doing certain things — this way you literally can\'t miss. Removes stress and improves your organisation and ability to get things done.',
  },
  {
    num: '02',
    title: 'Goal Setting',
    body: 'Both short and long-term goals give you a sense of accomplishment. Phases and goals set on onboarding give you a clear vision — your mindset will be automatically destined to reach it.',
  },
  {
    num: '03',
    title: 'Communication',
    body: 'Simply talking when you are in a negative state can help enormously. You can find the root cause and start to build on it to ensure you can overcome that state.',
  },
  {
    num: '04',
    title: 'Self Belief',
    body: 'Never doubt yourself. Failures are not a bad thing — they give us motivation to do better. Poor check-in, missed session — look at it positively. You have the power to do what you set out to do.',
  },
  {
    num: '05',
    title: 'Journalling',
    body: "Jot your thoughts down or do a weekly reflection. It allows you to reset, know where you went wrong, and what went well. Clear your mind and go into the next week with a fresh head.",
  },
  {
    num: '06',
    title: 'Stop Comparing',
    body: 'Focus on you and only you. Everyone is on different paths and journeys. Focus on yours and you will feel so much better — it really is that simple.',
  },
  {
    num: '07',
    title: 'Embrace the Fitness',
    body: 'Working hard and implementing the plan will make you feel 10x better. You will feel successful and know you are having productive days. Putting in 50% gets half-arsed results.',
  },
  {
    num: '08',
    title: 'The Weekend Warrior',
    body: "It is okay to say no. Get the balance between working on your fitness and still having a good social life. You will feel far less guilty — and far better the next day.",
  },
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
