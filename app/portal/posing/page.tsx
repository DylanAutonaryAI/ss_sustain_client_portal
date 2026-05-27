'use client';

import PortalTopbar from '@/components/layout/PortalTopbar';
import { useContent } from '@/context/ContentContext';

function extractYouTubeId(input: string): string {
  const m1 = input.match(/shorts\/([a-zA-Z0-9_-]+)/);  if (m1) return m1[1];
  const m2 = input.match(/[?&]v=([a-zA-Z0-9_-]+)/);    if (m2) return m2[1];
  const m3 = input.match(/youtu\.be\/([a-zA-Z0-9_-]+)/); if (m3) return m3[1];
  return input.trim();
}

export default function PosingPage() {
  const { posingVideos, posingTips } = useContent();

  return (
    <>
      <PortalTopbar title="Posing Area" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Posing <em className="italic" style={{ color: 'var(--accent-text)' }}>Area</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Posing is 50% of the stage. Practice daily.
        </p>

        {posingVideos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Pose tutorials</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {posingVideos.map((v) => {
                const videoId = extractYouTubeId(v.youtubeUrl);
                return (
                  <div key={v.id} className="rounded-[10px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="relative" style={{ paddingTop: '177.78%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={v.label}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{v.label}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text3)' }}>YouTube</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {posingTips.length > 0 && (
          <>
            <div className="h-px my-6" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Coach tips</span>
            </div>
            {posingTips.map((tip) => (
              <div
                key={tip.id}
                className="px-[18px] py-3.5 mb-2 rounded-r-[9px] text-[13px] leading-[1.7]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', color: 'var(--text2)', boxShadow: 'var(--shadow-sm)' }}
              >
                <strong style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{tip.key}:</strong> {tip.body}
              </div>
            ))}
          </>
        )}

        {posingVideos.length === 0 && posingTips.length === 0 && (
          <div className="rounded-xl px-6 py-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No posing content added yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
