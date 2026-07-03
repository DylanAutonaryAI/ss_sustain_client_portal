'use client';

import { useMobileNav } from '@/context/MobileNavContext';

interface TopbarProps {
  title: string;
  statusLabel?: string;
}

export default function Topbar({ title, statusLabel }: TopbarProps) {
  const { setOpen } = useMobileNav();
  return (
    <div
      className="h-[54px] flex items-center px-4 md:px-7 gap-3 sticky top-0 z-40 border-b backdrop-blur-[16px]"
      style={{
        background: 'var(--topbar-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Hamburger — opens the sidebar drawer; hidden at lg where the sidebar
          is permanently docked. No-op on pages without a MobileNavProvider. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden -ml-1 p-1.5 rounded-[7px] flex-shrink-0"
        style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      <div
        className="font-serif text-[18px] tracking-[-0.3px] flex-1 truncate"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </div>
      {statusLabel && (
        <div
          className="inline-flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[11px] font-medium border flex-shrink-0"
          style={{
            background: 'var(--accent-dim)',
            borderColor: 'var(--accent-mid)',
            color: 'var(--accent-text)',
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full"
            style={{ background: 'var(--accent)', animation: 'blink 2s infinite' }}
          />
          {statusLabel}
        </div>
      )}
    </div>
  );
}
