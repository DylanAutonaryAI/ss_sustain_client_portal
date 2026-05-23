import Topbar from '@/components/layout/Topbar';
import AnnounceStrip from '@/components/ui/AnnounceStrip';
import ResourceRow from '@/components/ui/ResourceRow';
import { announcements } from '@/lib/mock-data/announcements';

export default function HomePage() {
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

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
            Quick access
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResourceRow icon="💬" title="Coach Messages"  subtitle="2 new from your coach" />
          <ResourceRow icon="🎬" title="Training Clips"  subtitle="New form guides this week" />
          <ResourceRow icon="🧠" title="Mindset Area"    subtitle="Tips, roadmap & identity work" />
          <ResourceRow icon="📺" title="Webinars"        subtitle="Nutrition deep dive — Apr 20" />
        </div>
      </div>
    </>
  );
}
