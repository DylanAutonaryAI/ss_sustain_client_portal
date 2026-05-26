'use client';

import Topbar from '@/components/layout/Topbar';
import SupplementRow from '@/components/ui/SupplementRow';
import { useContent } from '@/context/ContentContext';

export default function SupplementsPage() {
  const { supplements } = useContent();
  const essential = supplements.filter((s) => s.essential);
  const optional  = supplements.filter((s) => !s.essential);

  return (
    <>
      <Topbar title="Supplements" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Supplement <em className="italic" style={{ color: 'var(--accent-text)' }}>Guide</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          The basics done consistently beat everything.
        </p>

        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Essential stack</span>
            </div>
            {essential.map((s) => <SupplementRow key={s.id} supp={s} />)}
            {essential.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No essential supplements added.</p>}
          </div>

          <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Optional add-ons</span>
            </div>
            {optional.map((s) => <SupplementRow key={s.id} supp={s} />)}
            {optional.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No optional supplements added.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
