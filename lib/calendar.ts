import type { CommunityEvent } from '@/lib/types';

// Community events store the time as a display string ("7:00 PM BST") and the
// duration as "60 min". We parse those into real start/end instants, treating the
// wall-clock time as UK time (Europe/London) so a client in ANY timezone sees the
// correct local time in their own calendar. If the time can't be parsed we fall
// back to an all-day event on the date, which is always safe.

// Convert a wall-clock time in an IANA timezone to a UTC Date (DST-aware, no deps).
function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(utcGuess))) m[p.type] = p.value;
  const hh = m.hour === '24' ? '00' : m.hour;
  const asTz = Date.UTC(+m.year, +m.month - 1, +m.day, +hh, +m.minute, +m.second);
  return new Date(utcGuess - (asTz - utcGuess));
}

function parseTime(time: string): { h: number; m: number } | null {
  const m = (time || '').trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

function parseDurationMin(duration: string): number {
  const t = (duration || '').toLowerCase();
  const hM = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour)/);
  const mM = t.match(/(\d+)\s*(?:m|min)/);
  let mins = 0;
  if (hM) mins += Math.round(parseFloat(hM[1]) * 60);
  if (mM) mins += parseInt(mM[1], 10);
  return mins > 0 ? mins : 60; // sensible default when unparseable
}

type Instant = { start: Date; end: Date; allDay: false } | { start: Date; allDay: true };

export function eventInstant(ev: CommunityEvent): Instant {
  const [y, mo, d] = ev.date.split('-').map(Number);
  const t = parseTime(ev.time);
  if (!y || !mo || !d || !t) return { start: new Date(Date.UTC(y, mo - 1, d)), allDay: true };
  const start = zonedToUtc(y, mo, d, t.h, t.m, 'Europe/London');
  const end = new Date(start.getTime() + parseDurationMin(ev.duration) * 60000);
  return { start, end, allDay: false };
}

// ── formatting helpers ──
const pad = (n: number) => String(n).padStart(2, '0');
const icsUtc = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const icsDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function details(ev: CommunityEvent): string {
  let s = ev.description || '';
  if (ev.link) s += (s ? '\n\n' : '') + `Join: ${ev.link}`;
  return s;
}

// Google Calendar "add event" template link.
export function googleCalUrl(ev: CommunityEvent): string {
  const inst = eventInstant(ev);
  const dates = inst.allDay
    ? `${icsDate(inst.start)}/${icsDate(new Date(inst.start.getTime() + 86_400_000))}`
    : `${icsUtc(inst.start)}/${icsUtc(inst.end)}`;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates, details: details(ev) });
  if (ev.link) p.set('location', ev.link);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Outlook.com "compose event" deep link.
export function outlookUrl(ev: CommunityEvent): string {
  const inst = eventInstant(ev);
  const p = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: ev.title, body: details(ev) });
  if (inst.allDay) { p.set('startdt', inst.start.toISOString().slice(0, 10)); p.set('allday', 'true'); }
  else { p.set('startdt', inst.start.toISOString()); p.set('enddt', inst.end.toISOString()); }
  if (ev.link) p.set('location', ev.link);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}

// A single-event .ics file (Apple Calendar / iCloud, and any app that reads ICS).
export function buildIcs(ev: CommunityEvent): string {
  const inst = eventInstant(ev);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SS Sustain//Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}@sssustain`,
    `DTSTAMP:${icsUtc(new Date())}`,
    inst.allDay ? `DTSTART;VALUE=DATE:${icsDate(inst.start)}` : `DTSTART:${icsUtc(inst.start)}`,
    inst.allDay ? `DTEND;VALUE=DATE:${icsDate(new Date(inst.start.getTime() + 86_400_000))}` : `DTEND:${icsUtc(inst.end)}`,
    `SUMMARY:${icsEscape(ev.title)}`,
    `DESCRIPTION:${icsEscape(details(ev))}`,
    ev.link ? `LOCATION:${icsEscape(ev.link)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
