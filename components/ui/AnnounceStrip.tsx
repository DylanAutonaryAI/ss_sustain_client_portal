'use client';

import { useEffect, useState } from 'react';
import type { Announcement } from '@/lib/types';

const STORAGE_KEY = 'ss-dismissed-announcements';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export default function AnnounceStrip({ announcement }: { announcement: Announcement }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(getDismissed().has(announcement.id));
  }, [announcement.id]);

  function dismiss() {
    const ids = getDismissed();
    ids.add(announcement.id);
    saveDismissed(ids);
    setDismissed(true);
  }

  if (dismissed) return null;

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
      <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text3)' }}>
          {announcement.time}
        </span>
        <button
          onClick={dismiss}
          title="Dismiss"
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] leading-none transition-all duration-150"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--border2)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
