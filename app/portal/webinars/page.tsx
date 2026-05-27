'use client';

import PortalTopbar from '@/components/layout/PortalTopbar';
import VideoCard from '@/components/ui/VideoCard';
import { useContent } from '@/context/ContentContext';

export default function WebinarsPage() {
  const { webinars } = useContent();

  return (
    <>
      <PortalTopbar title="Webinars" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Webinar <em className="italic" style={{ color: 'var(--accent-text)' }}>Hub</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Recorded deep dives from Sam. Click any to watch.
        </p>

        {webinars.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Recorded sessions</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>{webinars.length} videos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {webinars.map((w) => (
                <VideoCard key={w.id} tag={w.tag ?? ''} title={w.title} meta={w.meta} url={w.url} />
              ))}
            </div>
          </>
        ) : (
          <div
            className="rounded-xl px-6 py-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No webinars added yet. Check back soon.</p>
          </div>
        )}
      </div>
    </>
  );
}
