'use client';

interface VideoCardProps {
  tag: string;
  title: string;
  meta: string;
}

export default function VideoCard({ tag, title, meta }: VideoCardProps) {
  return (
    <div
      className="rounded-[10px] overflow-hidden cursor-pointer transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--accent-mid)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow)';
        const circle = el.querySelector('.play-circle') as HTMLDivElement | null;
        if (circle) circle.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--border)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--shadow-sm)';
        const circle = el.querySelector('.play-circle') as HTMLDivElement | null;
        if (circle) circle.style.transform = 'scale(1)';
      }}
    >
      <div
        className="aspect-video flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--bg3)' }}
      >
        {tag && (
          <span
            className="absolute top-2 left-2 text-[9px] font-semibold tracking-[1px] uppercase px-[7px] py-[3px] rounded-[4px] z-10"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--accent-text)' }}
          >
            {tag}
          </span>
        )}
        <div
          className="play-circle w-9 h-9 rounded-full flex items-center justify-center z-10 transition-transform duration-200"
          style={{ background: 'rgba(22,196,90,0.85)' }}
        >
          <div
            className="ml-[2px]"
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '10px solid #fff',
            }}
          />
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-[12px] font-medium mb-[2px] leading-[1.4]" style={{ color: 'var(--text)' }}>
          {title}
        </h4>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{meta}</p>
      </div>
    </div>
  );
}
