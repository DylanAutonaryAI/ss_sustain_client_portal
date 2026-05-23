import Topbar from '@/components/layout/Topbar';
import VideoCard from '@/components/ui/VideoCard';
import { trainingClips } from '@/lib/mock-data/training';

export default function TrainingPage() {
  return (
    <>
      <Topbar title="Training Clips" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Training <em className="italic" style={{ color: 'var(--accent-text)' }}>Clips</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Form guides, demos and technique breakdowns.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {trainingClips.map((v) => (
            <VideoCard key={v.id} tag={v.tag} title={v.title} meta={v.meta} />
          ))}
        </div>
      </div>
    </>
  );
}
