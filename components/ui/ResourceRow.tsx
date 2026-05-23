'use client';

interface ResourceRowProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export default function ResourceRow({ icon, title, subtitle, onClick }: ResourceRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3.5 px-[18px] py-3.5 rounded-[10px] mb-2 cursor-pointer transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--accent-mid)';
        el.style.background = 'var(--surface2)';
        el.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--border)';
        el.style.background = 'var(--surface)';
        el.style.transform = 'translateX(0)';
      }}
    >
      <div
        className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[16px] flex-shrink-0"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium mb-px" style={{ color: 'var(--text)' }}>{title}</h4>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{subtitle}</p>
      </div>
      <span className="ml-auto text-[16px]" style={{ color: 'var(--text3)' }}>›</span>
    </div>
  );
}
