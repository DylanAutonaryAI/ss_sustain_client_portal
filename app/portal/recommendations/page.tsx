import Topbar from '@/components/layout/Topbar';
import ResourceRow from '@/components/ui/ResourceRow';
import { recommendations } from '@/lib/mock-data/library';

export default function RecommendationsPage() {
  return (
    <>
      <Topbar title="Recommendations" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[720px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Coach <em className="italic" style={{ color: 'var(--accent-text)' }}>Recommendations</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Gear, food and daily essentials your coach personally uses.
        </p>
        {recommendations.map((r) => (
          <ResourceRow key={r.id} icon={r.icon} title={r.title} subtitle={r.subtitle} />
        ))}
      </div>
    </>
  );
}
