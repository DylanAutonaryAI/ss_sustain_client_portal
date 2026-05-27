import type { ClientStatus } from '@/lib/types';

export function StatusPill({ status }: { status: ClientStatus }) {
  const palette =
    status === 'Active'
      ? { background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', color: 'var(--accent-text)' }
      : status === 'Paused'
        ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--amber)' }
        : { background: 'rgba(240,79,79,0.1)', border: '1px solid rgba(240,79,79,0.2)', color: 'var(--red)' };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-semibold uppercase tracking-[0.5px]"
      style={palette}
    >
      <span
        className="w-1 h-1 rounded-full"
        style={{ background: 'currentColor' }}
      />
      {status}
    </span>
  );
}

export function PayTag({ status }: { status: string }) {
  const isPaid = status === 'Paid';
  return (
    <span
      className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px]"
      style={
        isPaid
          ? { background: 'var(--accent-dim)', color: 'var(--accent-text)' }
          : { background: 'rgba(240,79,79,0.1)', color: 'var(--red)' }
      }
    >
      {status}
    </span>
  );
}

export function HealthDot({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--accent)' :
    score >= 40 ? 'var(--amber)' :
    'var(--red)';
  const shadow =
    score >= 70 ? 'rgba(22,196,90,0.5)' :
    score >= 40 ? 'rgba(245,158,11,0.5)' :
    'rgba(240,79,79,0.5)';
  const textColor =
    score >= 70 ? 'var(--accent-text)' :
    score >= 40 ? 'var(--amber)' :
    'var(--red)';

  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${shadow}` }}
      />
      <span style={{ color: textColor }}>{score}</span>
    </span>
  );
}
