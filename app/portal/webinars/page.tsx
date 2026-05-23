import Topbar from '@/components/layout/Topbar';
import WebinarRow from '@/components/ui/WebinarRow';
import VideoCard from '@/components/ui/VideoCard';
import { upcomingWebinars, recordedWebinars } from '@/lib/mock-data/webinars';

export default function WebinarsPage() {
  return (
    <>
      <Topbar title="Webinars" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Webinar <em className="italic" style={{ color: 'var(--accent-text)' }}>Hub</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Live sessions and recorded deep dives.
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Upcoming</span>
        </div>
        {upcomingWebinars.map((w) => (
          <WebinarRow key={w.id} webinar={w} />
        ))}

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Recorded sessions</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {recordedWebinars.map((w) => (
            <VideoCard key={w.id} tag={w.tag ?? ''} title={w.title} meta={w.meta} />
          ))}
        </div>
      </div>
    </>
  );
}
