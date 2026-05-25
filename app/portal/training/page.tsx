'use client';

import Topbar from '@/components/layout/Topbar';
import VideoCard from '@/components/ui/VideoCard';
import { useContent } from '@/context/ContentContext';

export default function TrainingPage() {
  const { trainingVideos } = useContent();

  return (
    <>
      <Topbar title="Training Clips" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[760px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Training <em className="italic" style={{ color: 'var(--accent-text)' }}>Clips</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Reference demos from your coach, plus how to submit your form-check clips.
        </p>

        {/* Sam's reference videos — only shown if added */}
        {trainingVideos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Reference videos</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {trainingVideos.map((v) => (
                <VideoCard key={v.id} tag={v.tag} title={v.title} meta={v.meta} url={v.url} />
              ))}
            </div>
            <div className="h-px mb-8" style={{ background: 'var(--border)' }} />
          </>
        )}

        {/* Client submission guide */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Submitting your clips</span>
        </div>

        <div
          className="rounded-xl px-[22px] py-5 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>How it works</h3>
          <ol className="space-y-2">
            {[
              'Film your exercise — aim for a clear side or rear angle',
              'Save the clip to your camera roll or cloud storage',
              'Send 6 clips per week via the messaging tab or your check-in',
              'Sam will review your form and leave feedback on your next check-in',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] leading-[1.6]" style={{ color: 'var(--text2)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-[1px]" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="font-serif text-[16px] tracking-[-0.2px] mb-3" style={{ color: 'var(--text)' }}>What to film</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { muscle: 'Chest',     examples: 'Bench press, incline DB press, cable fly' },
              { muscle: 'Back',      examples: 'Lat pulldown, bent-over row, cable row' },
              { muscle: 'Legs',      examples: 'Squat, leg press, RDL, leg extension' },
              { muscle: 'Shoulders', examples: 'Overhead press, lateral raise, rear delt' },
              { muscle: 'Arms',      examples: 'Barbell curl, tricep pushdown, hammer curl' },
              { muscle: 'Compound',  examples: 'Deadlift, hip thrust, pull-up' },
            ].map((item) => (
              <div key={item.muscle} className="px-4 py-3 rounded-[9px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{item.muscle}</p>
                <p className="text-[11px] leading-[1.5]" style={{ color: 'var(--text3)' }}>{item.examples}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-[18px] py-3.5 rounded-r-[9px] text-[13px] leading-[1.7]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', color: 'var(--text2)', boxShadow: 'var(--shadow-sm)' }}>
          <strong style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Daily non-negotiable:</strong> 6 training clips sent per week is a requirement of the programme. These allow Sam to give you accurate, personalised form feedback.
        </div>
      </div>
    </>
  );
}
