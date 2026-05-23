interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  valueColor?: string;
}

export default function StatCard({ label, value, change, changeType = 'neutral', valueColor }: StatCardProps) {
  const changeColor =
    changeType === 'up'   ? 'var(--accent-text)' :
    changeType === 'down' ? 'var(--red)' :
    'var(--text3)';

  return (
    <div
      className="rounded-xl px-[22px] py-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="text-[11px] font-medium tracking-[0.3px] mb-2" style={{ color: 'var(--text3)' }}>
        {label}
      </div>
      <div
        className="font-serif text-[30px] tracking-[-0.5px] leading-none mb-[5px]"
        style={{ color: valueColor ?? 'var(--text)' }}
      >
        {value}
      </div>
      {change && (
        <div className="text-[12px]" style={{ color: changeColor }}>
          {change}
        </div>
      )}
    </div>
  );
}
