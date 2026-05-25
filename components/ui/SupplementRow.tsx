import type { Supplement } from '@/lib/types';

export default function SupplementRow({ supp }: { supp: Supplement }) {
  return (
    <div
      className="flex items-start gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="text-[20px] w-9 text-center flex-shrink-0 mt-0.5">{supp.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium mb-[2px]" style={{ color: 'var(--text)' }}>{supp.name}</h4>
        <p className="text-[12px] leading-[1.5] mb-1.5" style={{ color: 'var(--text2)' }}>{supp.description}</p>
        {supp.url && (
          <a
            href={supp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold"
            style={{ color: 'var(--accent-text)', textDecoration: 'none' }}
          >
            Buy on Bulk →
          </a>
        )}
      </div>
      {supp.essential ? (
        <span
          className="text-[10px] font-semibold px-2.5 py-[3px] rounded-[6px] uppercase tracking-[0.5px] flex-shrink-0 mt-0.5"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-mid)',
            color: 'var(--accent-text)',
          }}
        >
          Essential
        </span>
      ) : (
        <span
          className="text-[10px] font-semibold px-2.5 py-[3px] rounded-[6px] uppercase tracking-[0.5px] flex-shrink-0 mt-0.5"
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            color: 'var(--text3)',
          }}
        >
          Optional
        </span>
      )}
    </div>
  );
}
