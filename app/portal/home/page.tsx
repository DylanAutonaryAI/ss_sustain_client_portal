'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import AnnounceStrip from '@/components/ui/AnnounceStrip';
import ResourceRow from '@/components/ui/ResourceRow';
import { Icons } from '@/components/layout/icons';
import { announcements } from '@/lib/mock-data/announcements';

export default function HomePage() {
  const [photoRefOpen, setPhotoRefOpen] = useState(false);

  return (
    <>
      <Topbar title="Home" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Good morning, <em className="italic" style={{ color: 'var(--accent-text)' }}>Dylan.</em>
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
            icon={Icons.message}
            title="Coach Messages"
            subtitle="2 new from your coach"
            href="/portal/messages"
            badge={2}
            color="#20B623"
          />
          <ResourceRow
            icon={Icons.barbell}
            title="Training Clips"
            subtitle="New form guides this week"
            href="/portal/training"
            badge="New"
            color="#3b82f6"
          />
          <ResourceRow
            icon={Icons.brain}
            title="Mindset Area"
            subtitle="Tips, roadmap & identity work"
            href="/portal/mindset"
            color="#8b5cf6"
          />
          <ResourceRow
            icon={Icons.monitor}
            title="Webinars"
            subtitle="Nutrition deep dive — Apr 20"
            href="/portal/webinars"
            color="#f59e0b"
          />
        </div>
      </div>
    </>
  );
}
