'use client';

import Topbar from '@/components/layout/Topbar';
import { useContent } from '@/context/ContentContext';
import type { ShoppingCategory } from '@/lib/types';

const SHOPPING_COLS: ShoppingCategory[] = ['Protein', 'Carbs', 'Fats', 'Other'];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[20px] tracking-[-0.3px] mb-4" style={{ color: 'var(--text)' }}>
      {children}
    </h2>
  );
}

export default function RecommendationsPage() {
  const { gymBag, shopping, nonNeg } = useContent();

  const shoppingByCol = (cat: ShoppingCategory) => shopping.filter(i => i.category === cat).map(i => i.name);
  const maxRows = Math.max(...SHOPPING_COLS.map(c => shoppingByCol(c).length));

  return (
    <>
      <Topbar title="Recommendations" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Coach <em className="italic" style={{ color: 'var(--accent-text)' }}>Recommendations</em>
        </div>
        <p className="text-[13px] mb-8" style={{ color: 'var(--text2)' }}>
          Gear, food and daily habits your coach recommends for every client.
        </p>

        {/* Gym Bag */}
        <SectionHeading>🎒 Gym Bag Essentials</SectionHeading>
        {gymBag.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {gymBag.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <h4 className="text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{item.name}</h4>
                <p className="text-[12px] leading-[1.6] mb-3" style={{ color: 'var(--text2)' }}>{item.desc}</p>
                {item.linkUrl && (
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>
                    {item.linkLabel || 'View link'} →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] mb-8" style={{ color: 'var(--text3)' }}>No items added yet.</p>
        )}

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {/* Shopping Essentials */}
        <SectionHeading>🛒 Shopping Essentials</SectionHeading>
        {shopping.length > 0 ? (
          <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {SHOPPING_COLS.map((col) => (
                    <th key={col} className="px-4 py-3 text-left font-semibold tracking-[0.3px] uppercase text-[10px]" style={{ color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {SHOPPING_COLS.map((cat, ci) => (
                      <td key={ci} className="px-4 py-2.5" style={{ color: 'var(--text2)' }}>
                        {shoppingByCol(cat)[i] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[13px] mb-8" style={{ color: 'var(--text3)' }}>No shopping items added yet.</p>
        )}

        <div className="h-px mb-8" style={{ background: 'var(--border)' }} />

        {/* Daily Non-Negotiables */}
        <SectionHeading>✅ Daily Non-Negotiables</SectionHeading>
        {nonNeg.length > 0 ? (
          <div className="space-y-2">
            {nonNeg.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3.5 rounded-[10px]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
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
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No items added yet.</p>
        )}
      </div>
    </>
  );
}
