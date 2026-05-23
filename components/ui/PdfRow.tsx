'use client';

import type { PdfResource } from '@/lib/types';

export default function PdfRow({ pdf }: { pdf: PdfResource }) {
  return (
    <div
      className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2 cursor-pointer transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-mid)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      <div
        className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-[15px] flex-shrink-0"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
      >
        📄
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium mb-px" style={{ color: 'var(--text)' }}>{pdf.title}</h4>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{pdf.meta}</p>
      </div>
      <span className="ml-auto text-[11px] font-semibold tracking-[0.3px]" style={{ color: 'var(--accent-text)' }}>
        Download ↓
      </span>
    </div>
  );
}
