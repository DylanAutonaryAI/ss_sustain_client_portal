import Topbar from '@/components/layout/Topbar';

const gymBagItems = [
  {
    name: 'A Lifting Belt',
    desc: 'Used for compound movements — squats, RDLs, bent-over rows, deadlifts.',
    links: [
      { label: 'View on RDX Sports', url: 'https://rdxsports.co.uk/rdx-leather-4-padded-training-lifting-belt/' },
    ],
  },
  {
    name: 'Shaker Bottle',
    desc: 'For water and supplements — pre, intra or post workout (creatine, whey protein, EAAs).',
    links: [
      { label: 'View on Bulk', url: 'https://www.bulk.com/uk/iconic-shaker-bottle.html' },
    ],
  },
  {
    name: 'Log Book',
    desc: 'Vital for training progression. Record your lifts so you can follow and build on a set plan.',
    links: [
      { label: 'View on Amazon', url: 'https://www.amazon.co.uk/Workout-Log-Gym-Grey-Training/dp/B01H3D1GCW/' },
    ],
  },
  {
    name: 'Wrist Straps / Knee Sleeves',
    desc: 'Supporting your wrists and knees whilst lifting — allows for more load and injury prevention.',
    links: [
      { label: 'View on Bulk', url: 'https://www.bulk.com/uk/lifting-straps.html' },
    ],
  },
];

const shoppingEssentials = {
  protein: ['5% Lean Beef Mince', 'Chicken Breast', 'Tuna', 'Turkey Mince 5%', 'Eggs', 'Greek Yoghurt', 'Quinoa', 'Nuts & Seeds', 'Pork', 'Oats', 'Steak'],
  carbs: ['Potatoes', 'Fruits', 'Bread', 'Rice', 'Pasta', 'Vegetables', 'Cereals', 'Oats', 'Granola', 'Noodles'],
  fats: ['Avocado', 'Peanut Butter', 'Dark Chocolate', 'Salmon', 'Yoghurt', 'Nuts', 'Cheese'],
  other: ['Water', 'Tupperware', 'Food Scales', 'Freezer Bags', 'Vitamins', 'Coffee', 'Zero Cal Flavoured Drops'],
};

const nonNegotiables = [
  { label: 'Steps', desc: 'Meeting your desired step target' },
  { label: 'Training', desc: 'Not missing training sessions' },
  { label: 'Macros & Cals', desc: 'Within a 5–10% leniency range' },
  { label: '6+ Hours Sleep', desc: 'For recovery and performance' },
  { label: 'Daily Metrics', desc: 'For daily fluctuations at check-in' },
  { label: 'Weekly Check-In', desc: 'Photos, weekly metrics and summary' },
  { label: '6 Training Clips', desc: 'Sent per week for training feedback' },
  { label: 'Communication', desc: 'Struggles, wins and group interaction' },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[20px] tracking-[-0.3px] mb-4" style={{ color: 'var(--text)' }}>
      {children}
    </h2>
  );
}

export default function RecommendationsPage() {
  return (
    <>
      <Topbar title="Recommendations" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[820px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Coach <em className="italic" style={{ color: 'var(--accent-text)' }}>Recommendations</em>
        </div>
        <p className="text-[13px] mb-8" style={{ color: 'var(--text2)' }}>
          Gear, food and daily habits your coach recommends for every client.
        </p>

        {/* Gym Bag */}
        <SectionHeading>🎒 Gym Bag Essentials</SectionHeading>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {gymBagItems.map((item) => (
            <div
              key={item.name}
              className="p-5 rounded-xl"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h4 className="text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{item.name}</h4>
              <p className="text-[12px] leading-[1.6] mb-3" style={{ color: 'var(--text2)' }}>{item.desc}</p>
              {item.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--accent-text)', textDecoration: 'none' }}
                >
                  {link.label} →
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {/* Shopping Essentials */}
        <SectionHeading>🛒 Shopping Essentials</SectionHeading>
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--bg3)' }}>
                {['Protein', 'Carbs', 'Fats', 'Other'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-semibold tracking-[0.3px] uppercase text-[10px]"
                    style={{ color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(shoppingEssentials.protein.length, shoppingEssentials.carbs.length, shoppingEssentials.fats.length, shoppingEssentials.other.length) }).map((_, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg3)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {[shoppingEssentials.protein, shoppingEssentials.carbs, shoppingEssentials.fats, shoppingEssentials.other].map((col, ci) => (
                    <td key={ci} className="px-4 py-2.5" style={{ color: 'var(--text2)' }}>
                      {col[i] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {/* Daily Non-Negotiables */}
        <SectionHeading>✅ Daily Non-Negotiables</SectionHeading>
        <div className="space-y-2">
          {nonNegotiables.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-4 px-5 py-3.5 rounded-[10px]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{item.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
