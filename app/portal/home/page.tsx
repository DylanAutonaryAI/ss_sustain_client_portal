'use client';

import { useState } from 'react';
import Link from 'next/link';
import PortalTopbar from '@/components/layout/PortalTopbar';
import AnnounceStrip from '@/components/ui/AnnounceStrip';
import ResourceRow from '@/components/ui/ResourceRow';

import { useCommunity, EVENT_STYLES } from '@/context/CommunityContext';
import MiniCalendar from '@/components/ui/MiniCalendar';
import { useContent } from '@/context/ContentContext';
import { useAuth } from '@/context/AuthContext';

function UpcomingEventsWidget() {
  const { events, rsvp, myUserId } = useCommunity();
  const today = new Date().toISOString().slice(0, 10);
  const allUpcoming = events
    .filter(ev => ev.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = allUpcoming.slice(0, 3);

  if (!upcoming.length) return null;

  return (
    <>
      <div className="h-px my-6" style={{ background: 'var(--border)' }} />
      <div className="flex items-center justify-between mb-3.5">
        <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
          Coming up
        </span>
        <Link href="/portal/community" className="text-[11.5px] font-semibold" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>
          View all →
        </Link>
      </div>

      <div className="flex gap-4 items-start">
        {/* Event list */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {upcoming.map(ev => {
            const style = EVENT_STYLES[ev.type];
            const d = new Date(ev.date + 'T12:00:00');
            const day = d.getDate();
            const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const myRsvp = ev.rsvps.find(r => r.clientId === myUserId);
            const status = myRsvp?.status ?? 'pending';

            return (
              <div
                key={ev.id}
                className="flex items-center gap-3.5 px-4 py-3 rounded-[12px]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div
                  className="w-[40px] flex-shrink-0 rounded-[8px] flex flex-col items-center justify-center py-1.5 gap-px"
                  style={{ background: `color-mix(in srgb, ${style.color} 10%, transparent)`, border: `1.5px solid color-mix(in srgb, ${style.color} 20%, transparent)` }}
                >
                  <span className="text-[16px] font-bold leading-none" style={{ color: style.color }}>{day}</span>
                  <span className="text-[8px] font-semibold tracking-[0.6px]" style={{ color: style.color }}>{mon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-none mb-0.5" style={{ color: 'var(--text)' }}>{ev.title}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{ev.time} · {ev.duration}</p>
                </div>
                {status === 'pending' && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => rsvp(ev.id, 'attending')}
                      className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold text-white"
                      style={{ background: style.color }}
                    >
                      Going
                    </button>
                    <button
                      onClick={() => rsvp(ev.id, 'declined')}
                      className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)' }}
                    >
                      Skip
                    </button>
                  </div>
                )}
                {status === 'attending' && (
                  <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: style.color }}>✓ Going</span>
                )}
                {status === 'declined' && (
                  <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text3)' }}>✗ Skipping</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mini calendar */}
        <div className="w-[240px] flex-shrink-0">
          <MiniCalendar events={allUpcoming} showLegend={false} />
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const { announcements } = useContent();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [photoRefOpen, setPhotoRefOpen] = useState(false);

  return (
    <>
      <PortalTopbar title="Home" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Good morning, <em className="italic" style={{ color: 'var(--accent-text)' }}>{firstName}.</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Here&apos;s what&apos;s happening this week.
        </p>

        {announcements.map((a) => (
          <AnnounceStrip key={a.id} announcement={a} />
        ))}

        {/* Weekly check-in card */}
        <div
          className="mt-5 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--accent-mid)', boxShadow: 'var(--shadow-sm)', background: 'var(--accent-dim)' }}
        >
          {/* Header row — opens PDF */}
          <a
            href="/pdfs/check-in-process.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div
                className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px] flex-shrink-0"
                style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(32,182,35,0.3)' }}
              >
                📋
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Weekly Check-In Guide</p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Photos, metrics and summary</p>
              </div>
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--accent-text)' }}>Open PDF →</span>
            </div>
          </a>

          {/* Photo reference toggle */}
          <button
            onClick={() => setPhotoRefOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-2 text-left transition-colors duration-150"
            style={{ background: 'var(--accent-dim)', borderTop: '1px solid var(--accent-mid)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: 'var(--text3)' }}>
              Progress photo reference
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text3)', transform: photoRefOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {/* Collapsible image */}
          {photoRefOpen && (
            <div style={{ borderTop: '1px solid var(--accent-mid)' }}>
              <img
                src="/images/progress-picture-references.png"
                alt="Progress picture references — front, side and back shot"
                style={{ width: '70%', display: 'block', margin: '0 auto', padding: '12px 0' }}
              />
            </div>
          )}
        </div>

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
            Quick access
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResourceRow
            icon={<span style={{ fontSize: 22 }}>🏋️</span>}
            title="Training Clips"
            subtitle="New form guides this week"
            href="/portal/training"
            badge="New"
            color="#3b82f6"
          />
          <ResourceRow
            icon={<span style={{ fontSize: 22 }}>🧠</span>}
            title="Mindset Area"
            subtitle="Tips, roadmap & identity work"
            href="/portal/mindset"
            color="#8b5cf6"
          />
          <ResourceRow
            icon={<span style={{ fontSize: 22 }}>🎬</span>}
            title="Webinars"
            subtitle="Nutrition deep dive — Apr 20"
            href="/portal/webinars"
            color="#f59e0b"
          />
          <ResourceRow
            icon={<span style={{ fontSize: 22 }}>📚</span>}
            title="Resource Library"
            subtitle="PDFs, guides & nutrition packs"
            href="/portal/library"
            color="#06b6d4"
          />
        </div>

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
            Your apps
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://www.loom.com/share/99d9072bf1dd438da8ab7423002d6782"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all duration-150"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
          >
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px] flex-shrink-0"
              style={{ background: 'color-mix(in srgb, #f97316 12%, transparent)', border: '1.5px solid color-mix(in srgb, #f97316 25%, transparent)' }}
            >
              🏋️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-none mb-0.5" style={{ color: 'var(--text)' }}>1fit</p>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Check-ins & video feedback</p>
            </div>
            <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: '#f97316' }}>Setup →</span>
          </a>

          <a
            href="https://www.loom.com/share/035a1d6ce47c4e4e86faa5691711992e"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-[12px] transition-all duration-150"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
          >
            <div
              className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[18px] flex-shrink-0"
              style={{ background: 'color-mix(in srgb, #3b82f6 12%, transparent)', border: '1.5px solid color-mix(in srgb, #3b82f6 25%, transparent)' }}
            >
              🥗
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-none mb-0.5" style={{ color: 'var(--text)' }}>MyFitnessPal</p>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Daily nutrition tracking</p>
            </div>
            <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: '#3b82f6' }}>Setup →</span>
          </a>
        </div>

        <UpcomingEventsWidget />
      </div>
    </>
  );
}
