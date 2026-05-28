'use client';

import { useState } from 'react';
import type { CommunityEvent } from '@/lib/types';
import { EVENT_STYLES } from '@/context/CommunityContext';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MiniCalendarProps {
  events: CommunityEvent[];
  selectedDate?: string | null;
  onDaySelect?: (date: string | null) => void;
  showLegend?: boolean;
}

function buildCells(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawFirst = new Date(year, month, 1).getDay(); // 0=Sun
  const firstOffset = rawFirst === 0 ? 6 : rawFirst - 1; // Monday-based

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MiniCalendar({
  events,
  selectedDate,
  onDaySelect,
  showLegend = true,
}: MiniCalendarProps) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Build event lookup: dateStr → array of events
  const eventMap: Record<string, CommunityEvent[]> = {};
  for (const ev of events) {
    if (!eventMap[ev.date]) eventMap[ev.date] = [];
    eventMap[ev.date].push(ev);
  }

  const cells = buildCells(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const selectedDayEvents = selectedDate ? (eventMap[selectedDate] ?? []) : [];

  // Active event types in the current month for legend
  const activeTypes = new Set(
    Object.entries(eventMap)
      .filter(([date]) => {
        const d = new Date(date + 'T12:00:00');
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .flatMap(([, evs]) => evs.map(e => e.type))
  );

  return (
    <div
      className="rounded-[14px] overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[15px] transition-colors duration-100"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          ‹
        </button>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[15px] transition-colors duration-100"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          ›
        </button>
      </div>

      <div className="p-3">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text3)' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-[2px]">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-[34px]" />;

            const ds = toDateStr(viewYear, viewMonth, day);
            const dayEvents = eventMap[ds] ?? [];
            const hasEvents = dayEvents.length > 0;
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;
            const isPast = ds < todayStr;

            return (
              <button
                key={i}
                onClick={() => { if (onDaySelect) onDaySelect(isSelected ? null : ds); }}
                className="h-[34px] flex flex-col items-center justify-center rounded-[7px] gap-[2px] transition-all duration-100"
                style={{
                  background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-dim)' : 'none',
                  border: '1px solid transparent',
                  boxShadow: isToday && !isSelected ? '0 0 0 2px var(--accent-mid)' : 'none',
                  cursor: onDaySelect ? 'pointer' : 'default',
                  opacity: isPast && !isToday ? 0.55 : 1,
                }}
                onMouseEnter={e => { if (onDaySelect && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = isToday ? 'var(--accent-dim)' : 'none'; }}
              >
                <span
                  className="text-[11.5px] font-medium leading-none"
                  style={{
                    color: isSelected ? '#fff' : isToday ? 'var(--accent-text)' : 'var(--text)',
                  }}
                >
                  {day}
                </span>
                {hasEvents && (
                  <div className="flex gap-[2px] items-center">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ background: isSelected ? '#fff' : EVENT_STYLES[ev.type].color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px 14px' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.8px] mb-2" style={{ color: 'var(--text3)' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {selectedDayEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {selectedDayEvents.map(ev => {
                const style = EVENT_STYLES[ev.type];
                return (
                  <div key={ev.id} className="flex items-start gap-2.5">
                    <div
                      className="w-[3px] self-stretch rounded-full flex-shrink-0 mt-[2px]"
                      style={{ background: style.color }}
                    />
                    <div>
                      <p className="text-[12px] font-semibold leading-none mb-[3px]" style={{ color: 'var(--text)' }}>
                        {ev.title}
                      </p>
                      <p className="text-[10.5px]" style={{ color: 'var(--text3)' }}>
                        {ev.time} · {ev.duration}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11.5px]" style={{ color: 'var(--text3)' }}>No events scheduled this day.</p>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && activeTypes.size > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px 12px' }}>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {(Object.entries(EVENT_STYLES) as [string, { label: string; color: string }][])
              .filter(([type]) => activeTypes.has(type as never))
              .map(([type, style]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: style.color }} />
                  <span className="text-[10.5px]" style={{ color: 'var(--text3)' }}>{style.label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
