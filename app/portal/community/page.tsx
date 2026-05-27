'use client';

import { useState } from 'react';
import PortalTopbar from '@/components/layout/PortalTopbar';
import MiniCalendar from '@/components/ui/MiniCalendar';
import { useCommunity, EVENT_STYLES } from '@/context/CommunityContext';
import type { CommunityEvent, EventRSVP } from '@/lib/types';

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.getDate(),
    monthShort: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleString('en-GB', { weekday: 'long' }),
  };
}

function AvatarStack({ rsvps }: { rsvps: EventRSVP[] }) {
  const { myUserId } = useCommunity();
  const attending = rsvps.filter(r => r.clientId !== myUserId && r.status === 'attending');
  if (!attending.length) return null;
  const shown = attending.slice(0, 3);
  return (
    <div className="flex items-center gap-1.5 mt-3">
      <div className="flex -space-x-1.5">
        {shown.map(r => (
          <div
            key={r.clientId}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[var(--surface)]"
            style={{ background: 'var(--accent)' }}
            title={r.clientName}
          >
            {r.clientInitials}
          </div>
        ))}
      </div>
      <span className="text-[11px]" style={{ color: 'var(--text2)' }}>
        {attending.length === 1
          ? `${shown[0].clientName} is going`
          : `${shown[0].clientName} & ${attending.length - 1} others going`}
      </span>
    </div>
  );
}

function EventCard({ event, highlighted }: { event: CommunityEvent; highlighted?: boolean }) {
  const { rsvp, myUserId } = useCommunity();
  const myRsvp = event.rsvps.find(r => r.clientId === myUserId);
  const style = EVENT_STYLES[event.type];
  const dateInfo = formatEventDate(event.date);

  const [decliningOpen, setDecliningOpen] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [changing, setChanging] = useState(false);

  const status = myRsvp?.status ?? 'pending';
  const showButtons = status === 'pending' || changing;

  function handleAttend() {
    rsvp(event.id, 'attending');
    setChanging(false);
    setDecliningOpen(false);
  }

  function handleDeclineSubmit() {
    rsvp(event.id, 'declined', reasonText.trim() || undefined);
    setDecliningOpen(false);
    setReasonText('');
    setChanging(false);
  }

  return (
    <div
      className="rounded-[14px] p-5 mb-3 transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: highlighted ? `1.5px solid ${style.color}` : '1px solid var(--border)',
        boxShadow: highlighted ? `0 0 0 3px color-mix(in srgb, ${style.color} 12%, transparent)` : 'var(--shadow-sm)',
      }}
    >
      <div className="flex gap-4">
        <div
          className="w-[52px] flex-shrink-0 rounded-[10px] flex flex-col items-center justify-center py-2.5 gap-0.5"
          style={{
            background: `color-mix(in srgb, ${style.color} 10%, transparent)`,
            border: `1.5px solid color-mix(in srgb, ${style.color} 20%, transparent)`,
          }}
        >
          <span className="text-[22px] font-bold leading-none" style={{ color: style.color }}>{dateInfo.day}</span>
          <span className="text-[9px] font-semibold tracking-[0.8px]" style={{ color: style.color }}>{dateInfo.monthShort}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{event.title}</h3>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${style.color} 14%, transparent)`, color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <p className="text-[11.5px] mb-1" style={{ color: 'var(--text3)' }}>
            {dateInfo.weekday} · {event.time} · {event.duration}
          </p>
          <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--text2)' }}>{event.description}</p>

          <div className="mt-4">
            {showButtons && !decliningOpen && (
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-medium mr-1" style={{ color: 'var(--text3)' }}>
                  {changing ? 'Change response:' : 'Will you be there?'}
                </span>
                <button
                  onClick={handleAttend}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold text-white transition-all duration-150"
                  style={{ background: style.color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                >
                  Yes, I&apos;m in
                </button>
                <button
                  onClick={() => setDecliningOpen(true)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-150"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
                >
                  Can&apos;t make it
                </button>
                {changing && (
                  <button onClick={() => setChanging(false)} className="text-[11px] ml-1" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            )}

            {decliningOpen && (
              <div className="mt-1">
                <p className="text-[11.5px] mb-2" style={{ color: 'var(--text3)' }}>What&apos;s stopping you? (optional)</p>
                <textarea
                  value={reasonText}
                  onChange={e => setReasonText(e.target.value)}
                  placeholder="e.g. Working that evening, travelling..."
                  rows={2}
                  className="w-full rounded-[8px] text-[12px] px-3 py-2 outline-none resize-none"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'inherit', lineHeight: '1.6' }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleDeclineSubmit}
                    className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-semibold"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)' }}
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => { setDecliningOpen(false); setChanging(false); }}
                    className="px-3.5 py-1.5 rounded-[8px] text-[12px]"
                    style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showButtons && !decliningOpen && status === 'attending' && (
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold" style={{ color: style.color }}>✓ You&apos;re going</span>
                <button onClick={() => setChanging(true)} className="text-[11px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
                {event.link && (
                  <a href={event.link} target="_blank" rel="noopener noreferrer" className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-[6px]" style={{ background: `color-mix(in srgb, ${style.color} 14%, transparent)`, color: style.color, textDecoration: 'none' }}>
                    Join link →
                  </a>
                )}
              </div>
            )}

            {!showButtons && !decliningOpen && status === 'declined' && (
              <div className="flex items-center gap-3">
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
                  ✗ Can&apos;t attend{myRsvp?.reason && <em className="ml-1 not-italic"> · &ldquo;{myRsvp.reason}&rdquo;</em>}
                </span>
                <button onClick={() => setChanging(true)} className="text-[11px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
              </div>
            )}
          </div>

          {!decliningOpen && <AvatarStack rsvps={event.rsvps} />}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { events } = useCommunity();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = events
    .filter(ev => ev.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const filtered = selectedDate
    ? upcoming.filter(ev => ev.date === selectedDate)
    : upcoming;

  // Group by month
  const grouped: { key: string; label: string; events: CommunityEvent[] }[] = [];
  for (const ev of filtered) {
    const d = new Date(ev.date + 'T12:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const existing = grouped.find(g => g.key === key);
    if (existing) existing.events.push(ev);
    else grouped.push({ key, label, events: [ev] });
  }

  return (
    <>
      <PortalTopbar title="Community" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          The <em className="italic" style={{ color: 'var(--accent-text)' }}>Community</em>
        </div>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
          Live calls, workshops, and challenges with Sam and the group.
        </p>

        {/* WhatsApp CTA */}
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-[14px] mb-7"
          style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(18,140,65,0.08) 100%)', border: '1.5px solid rgba(37,211,102,0.25)' }}
        >
          <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 text-[22px]" style={{ background: 'rgba(37,211,102,0.15)' }}>
            💬
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>SS Sustain WhatsApp Group</p>
            <p className="text-[12px]" style={{ color: 'var(--text2)' }}>Daily accountability, questions, and group support — join the community chat.</p>
          </div>
          <a
            href="#"
            onClick={e => { e.preventDefault(); alert('WhatsApp link coming soon — Sam will provide the link.'); }}
            className="flex-shrink-0 px-4 py-2 rounded-[9px] text-[12px] font-bold text-white transition-all duration-150"
            style={{ background: '#25D366', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.filter = ''; }}
          >
            Join Group
          </a>
        </div>

        {/* Two-column split */}
        <div className="flex gap-6 items-start">

          {/* Left: events list */}
          <div className="flex-1 min-w-0">
            {selectedDate && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[12px]" style={{ color: 'var(--text2)' }}>
                  Showing events for <strong style={{ color: 'var(--text)' }}>{new Date(selectedDate + 'T12:00:00').toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] px-2 py-0.5 rounded-[5px]"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
                >
                  Clear ×
                </button>
              </div>
            )}

            {grouped.length === 0 ? (
              <div className="rounded-xl px-6 py-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
                  {selectedDate ? 'No events on this day.' : 'No upcoming events scheduled. Check back soon.'}
                </p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.key} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: 'var(--text3)' }}>{group.label}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{group.events.length} event{group.events.length > 1 ? 's' : ''}</span>
                  </div>
                  {group.events.map(ev => (
                    <EventCard key={ev.id} event={ev} highlighted={!!selectedDate} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Right: sticky calendar */}
          <div className="w-[270px] flex-shrink-0" style={{ position: 'sticky', top: '24px' }}>
            <MiniCalendar
              events={upcoming}
              selectedDate={selectedDate}
              onDaySelect={setSelectedDate}
              showLegend
            />
          </div>
        </div>
      </div>
    </>
  );
}
