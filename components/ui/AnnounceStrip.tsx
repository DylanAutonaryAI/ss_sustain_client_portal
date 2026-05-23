import type { Announcement } from '@/lib/types';

export default function AnnounceStrip({ announcement }: { announcement: Announcement }) {
  return (
    <div
      className="flex items-start gap-3.5 px-5 py-4 mb-2.5 rounded-r-[10px]"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${announcement.accentColor ?? 'var(--accent)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="text-[16px] flex-shrink-0 mt-px">{announcement.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold mb-[3px]" style={{ color: 'var(--text)' }}>
          {announcement.title}
        </h4>
        <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--text2)' }}>
          {announcement.body}
        </p>
      </div>
      <span className="text-[11px] flex-shrink-0 whitespace-nowrap ml-auto" style={{ color: 'var(--text3)' }}>
        {announcement.time}
      </span>
    </div>
  );
}
