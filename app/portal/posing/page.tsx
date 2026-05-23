import Topbar from '@/components/layout/Topbar';
import VideoCard from '@/components/ui/VideoCard';
import { posingVideos, posingTips } from '@/lib/mock-data/training';

export default function PosingPage() {
  return (
    <>
      <Topbar title="Posing Area" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Posing <em className="italic" style={{ color: 'var(--accent-text)' }}>Area</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Posing is 50% of the stage. Practice daily.
        </p>

        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Pose tutorials</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {posingVideos.map((v) => (
            <VideoCard key={v.id} tag={v.tag} title={v.title} meta={v.meta} />
          ))}
        </div>

        <div className="h-px my-6" style={{ background: 'var(--border)' }} />

        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Coach tips</span>
        </div>
        {posingTips.map((tip) => (
          <div
            key={tip.key}
            className="px-[18px] py-3.5 mb-2 rounded-r-[9px] text-[13px] leading-[1.7]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '2px solid var(--accent)',
              color: 'var(--text2)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <strong style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{tip.key}:</strong> {tip.body}
          </div>
        ))}
      </div>
    </>
  );
}
