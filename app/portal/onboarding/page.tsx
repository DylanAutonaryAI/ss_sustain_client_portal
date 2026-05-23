'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingVideos } from '@/lib/mock-data/onboarding';
import { useAuth } from '@/context/AuthContext';
import Topbar from '@/components/layout/Topbar';

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const router = useRouter();
  const { user } = useAuth();

  const video = onboardingVideos[current];
  const total = onboardingVideos.length;
  const allWatched = watched.size >= total;

  const markWatched = () => {
    setWatched((prev) => new Set([...prev, current]));
  };

  const handleNext = () => {
    markWatched();
    if (current < total - 1) {
      setCurrent(current + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('ss-onboarding-done', 'true');
    router.push('/portal/home');
  };

  const handleSkipAll = () => {
    localStorage.setItem('ss-onboarding-done', 'true');
    router.push('/portal/home');
  };

  const isLastVideo = current === total - 1;
  const currentWatched = watched.has(current);

  return (
    <>
      <Topbar title="Welcome" statusLabel={user?.phase} />
      <div className="px-8 py-7 max-w-[720px]">
        {/* Header */}
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Before you dive in, <em className="italic" style={{ color: 'var(--accent-text)' }}>watch these.</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          {watched.size} of {total} videos watched — complete all {total} to unlock your full portal.
        </p>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full mb-7 overflow-hidden"
          style={{ background: 'var(--bg3)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(watched.size / total) * 100}%`,
              background: 'var(--accent)',
            }}
          />
        </div>

        {/* Video steps */}
        <div className="flex gap-2 mb-7 flex-wrap">
          {onboardingVideos.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setCurrent(i)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150"
              style={
                i === current
                  ? { background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', color: 'var(--accent-text)' }
                  : watched.has(i)
                  ? { background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text2)' }
                  : { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)' }
              }
            >
              {watched.has(i) ? (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white flex-shrink-0"
                  style={{ background: 'var(--accent)' }}>✓</span>
              ) : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                  style={{
                    background: i === current ? 'var(--accent)' : 'var(--border2)',
                    color: i === current ? '#fff' : 'var(--text3)',
                  }}
                >
                  {i + 1}
                </span>
              )}
              Video {i + 1}
            </button>
          ))}
        </div>

        {/* Current video player mock */}
        <div
          className="rounded-[12px] overflow-hidden mb-5"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {/* Thumbnail area */}
          <div
            className="aspect-video flex flex-col items-center justify-center gap-4 relative"
            style={{ background: 'var(--bg3)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105"
              style={{ background: 'rgba(22,196,90,0.85)' }}
              onClick={markWatched}
            >
              <div
                className="ml-1"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderLeft: '17px solid #fff',
                }}
              />
            </div>
            <span
              className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-[1px] px-2 py-1 rounded"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--accent-text)' }}
            >
              {video.duration}
            </span>
            {currentWatched && (
              <span
                className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                ✓ Watched
              </span>
            )}
          </div>

          {/* Video info */}
          <div className="px-5 py-4" style={{ background: 'var(--surface)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[1px] mb-1" style={{ color: 'var(--accent-text)' }}>
                  Video {current + 1} of {total}
                </div>
                <h2 className="font-serif text-[20px] tracking-[-0.3px] mb-1" style={{ color: 'var(--text)' }}>
                  {video.title}
                </h2>
                <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--text2)' }}>
                  {video.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              {isLastVideo ? (
                <button
                  onClick={handleComplete}
                  disabled={!currentWatched && !allWatched}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                >
                  Complete & enter portal →
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                >
                  {currentWatched ? 'Next video →' : 'Mark as watched & continue →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Admin bypass */}
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSkipAll}
            className="text-[11px] transition-colors duration-150"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
          >
            Admin: skip all videos and enter portal →
          </button>
        </div>
      </div>
    </>
  );
}
