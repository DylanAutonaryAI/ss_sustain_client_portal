'use client';

import { useState } from 'react';
import type { CommunityEvent } from '@/lib/types';
import { googleCalUrl, outlookUrl, buildIcs } from '@/lib/calendar';

// Small "Add to calendar" button → menu with Google / Apple(iCloud) / Outlook.
// Google + Outlook open a prefilled web event; Apple downloads a .ics the phone
// opens straight into Calendar. Times are emitted in UTC (parsed from the event's
// UK time) so everyone sees the right local time.
export default function AddToCalendar({ event }: { event: CommunityEvent }) {
  const [open, setOpen] = useState(false);

  function downloadIcs() {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(event.title || 'event').replace(/[^\w]+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setOpen(false);
  }

  const item = 'block w-full text-left px-3 py-2 text-[12px] hover:opacity-80';
  const itemStyle: React.CSSProperties = { color: 'var(--text)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-[7px]"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Add to calendar
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-20 mt-1 rounded-[9px] overflow-hidden min-w-[160px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
          >
            <a href={googleCalUrl(event)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={item} style={itemStyle}>Google Calendar</a>
            <button onClick={downloadIcs} className={item} style={itemStyle}>Apple / iCloud</button>
            <a href={outlookUrl(event)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={item} style={itemStyle}>Outlook</a>
          </div>
        </>
      )}
    </div>
  );
}
