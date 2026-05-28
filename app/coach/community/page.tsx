'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import MiniCalendar from '@/components/ui/MiniCalendar';
import { useCommunity, EVENT_STYLES } from '@/context/CommunityContext';
import type { CommunityEvent, EventType } from '@/lib/types';

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'live-call',  label: 'Live Call' },
  { value: 'q-and-a',   label: 'Q&A' },
  { value: 'workshop',  label: 'Workshop' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'social',    label: 'Social' },
];

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.getDate(),
    monthShort: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleString('en-GB', { weekday: 'short' }),
    full: d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s',
  padding: '9px 12px',
  display: 'block',
};

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = 'var(--accent)';
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = 'var(--border2)';
}

const EMPTY_FORM = { title: '', description: '', type: 'live-call' as EventType, date: '', time: '', duration: '60 min', link: '' };

function EventRow({ event }: { event: CommunityEvent }) {
  const { updateEvent, deleteEvent } = useCommunity();
  const style = EVENT_STYLES[event.type];
  const dateInfo = formatEventDate(event.date);

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    type: event.type,
    date: event.date,
    time: event.time,
    duration: event.duration,
    link: event.link ?? '',
  });

  const attending = event.rsvps.filter(r => r.status === 'attending');
  const declined  = event.rsvps.filter(r => r.status === 'declined');
  const pending   = event.rsvps.filter(r => r.status === 'pending');

  function handleSave() {
    updateEvent(event.id, { ...form, link: form.link || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className="rounded-[14px] p-5 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--accent-mid)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputBase} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))} style={inputBase} onFocus={focusInput} onBlur={blurInput}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputBase} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Time</label>
            <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM BST" style={inputBase} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Duration</label>
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 60 min" style={inputBase} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical', lineHeight: '1.6' }} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Zoom / Meet Link</label>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://zoom.us/..." style={inputBase} onFocus={focusInput} onBlur={blurInput} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 rounded-[8px] text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>Save changes</button>
          <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-[8px] text-[12px]" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[14px] mb-3 overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="w-[46px] flex-shrink-0 rounded-[9px] flex flex-col items-center justify-center py-2 gap-0.5"
          style={{ background: `color-mix(in srgb, ${style.color} 10%, transparent)`, border: `1.5px solid color-mix(in srgb, ${style.color} 20%, transparent)` }}
        >
          <span className="text-[20px] font-bold leading-none" style={{ color: style.color }}>{dateInfo.day}</span>
          <span className="text-[9px] font-semibold tracking-[0.7px]" style={{ color: style.color }}>{dateInfo.monthShort}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>{event.title}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${style.color} 14%, transparent)`, color: style.color }}>{style.label}</span>
          </div>
          <span className="text-[11.5px]" style={{ color: 'var(--text3)' }}>{dateInfo.full} · {event.time} · {event.duration}</span>
        </div>

        {/* RSVP summary */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-[11.5px]">
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{attending.length}</span>
            <span style={{ color: 'var(--text3)' }}>going</span>
          </div>
          <div className="flex items-center gap-1 text-[11.5px]">
            <span className="font-semibold" style={{ color: 'var(--red)' }}>{declined.length}</span>
            <span style={{ color: 'var(--text3)' }}>declined</span>
          </div>
          <div className="flex items-center gap-1 text-[11.5px]">
            <span className="font-semibold" style={{ color: 'var(--text2)' }}>{pending.length}</span>
            <span style={{ color: 'var(--text3)' }}>pending</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(x => !x)}
            className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium transition-all duration-150"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
          >
            {expanded ? 'Hide' : 'RSVPs'}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium transition-all duration-150"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
          >
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button onClick={() => deleteEvent(event.id)} className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-semibold text-white" style={{ background: 'var(--red)' }}>
                Confirm
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1.5 rounded-[7px] text-[11px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium transition-all duration-150"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--red)' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* RSVP breakdown */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px 16px' }}>
          {event.rsvps.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>No RSVPs yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {['attending', 'declined', 'pending'].map(statusFilter => {
                const group = event.rsvps.filter(r => r.status === statusFilter);
                if (!group.length) return null;
                const color = statusFilter === 'attending' ? 'var(--accent)' : statusFilter === 'declined' ? 'var(--red)' : 'var(--text3)';
                const label = statusFilter === 'attending' ? 'Going' : statusFilter === 'declined' ? 'Declined' : 'Pending';
                return (
                  <div key={statusFilter}>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.7px] mb-1 block" style={{ color }}>{label}</span>
                    {group.map(r => (
                      <div key={r.clientId} className="flex items-center gap-2.5 py-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: color === 'var(--accent)' ? 'var(--accent)' : color === 'var(--red)' ? 'var(--red)' : 'var(--border2)' }}
                        >
                          {r.clientInitials}
                        </div>
                        <span className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{r.clientName}</span>
                        {r.reason && (
                          <span className="text-[11.5px]" style={{ color: 'var(--text3)' }}>
                            — &ldquo;{r.reason}&rdquo;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoachCommunityPage() {
  const { events, addEvent } = useCommunity();
  const [addOpen, setAddOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const filtered = selectedDate ? sorted.filter(ev => ev.date === selectedDate) : sorted;

  function handleAdd() {
    if (!form.title.trim() || !form.date || !form.time) return;
    addEvent({ ...form, link: form.link || undefined });
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

  return (
    <>
      <Topbar title="Community Events" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Community <em className="italic" style={{ color: 'var(--accent-text)' }}>Events</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Add and manage group calls, workshops, and challenges. See who&apos;s coming.
        </p>

        {/* Add event — full width */}
        <div
          className="rounded-[14px] mb-7 overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <button
            onClick={() => setAddOpen(x => !x)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>+ Add new event</span>
            <span style={{ color: 'var(--text3)', transform: addOpen ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {addOpen && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px 20px' }}>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly Group Call" style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))} style={inputBase} onFocus={focusInput} onBlur={blurInput}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Time</label>
                  <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM BST" style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 60 min" style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What clients need to know..." style={{ ...inputBase, resize: 'vertical', lineHeight: '1.6' }} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.7px] mb-1" style={{ color: 'var(--text3)' }}>Zoom / Meet Link (optional)</label>
                  <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://zoom.us/j/..." style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                </div>
              </div>
              <button
                onClick={handleAdd}
                className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-150"
                style={{ background: submitted ? '#0d8f3e' : 'var(--accent)' }}
                onMouseEnter={e => { if (!submitted) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
              >
                {submitted ? 'Event added ✓' : 'Add event'}
              </button>
            </div>
          )}
        </div>

        {/* Two-column split: events list + calendar */}
        <div className="flex gap-6 items-start">

          {/* Left: events list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'All events'}
              </span>
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-[11px] px-2 py-0.5 rounded-[5px]"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
                  >
                    Clear ×
                  </button>
                )}
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl px-6 py-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
                  {selectedDate ? 'No events on this day.' : 'No events yet. Add the first one above.'}
                </p>
              </div>
            ) : (
              filtered.map(ev => <EventRow key={ev.id} event={ev} />)
            )}
          </div>

          {/* Right: sticky calendar */}
          <div className="w-[270px] flex-shrink-0" style={{ position: 'sticky', top: '24px' }}>
            <MiniCalendar
              events={sorted}
              selectedDate={selectedDate}
              onDaySelect={(d) => {
                setSelectedDate(d);
                // Picking a day also primes the add-event form for that date.
                if (d) { setForm(f => ({ ...f, date: d })); setAddOpen(true); }
              }}
              showLegend
            />
          </div>
        </div>
      </div>
    </>
  );
}
