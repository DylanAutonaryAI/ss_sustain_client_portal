'use client';

interface TopbarProps {
  title: string;
  statusLabel?: string;
}

export default function Topbar({ title, statusLabel }: TopbarProps) {
  return (
    <div
      className="h-[54px] flex items-center px-7 gap-3 sticky top-0 z-40 border-b backdrop-blur-[16px]"
      style={{
        background: 'var(--topbar-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="font-serif text-[18px] tracking-[-0.3px] flex-1"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </div>
      {statusLabel && (
        <div
          className="inline-flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[11px] font-medium border"
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
