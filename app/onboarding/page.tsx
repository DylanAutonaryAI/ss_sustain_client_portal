'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingSteps } from '@/lib/mock-data/onboarding';
import SsLogo from '@/components/ui/SsLogo';

export default function OnboardingPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const router = useRouter();

  const total = onboardingSteps.length;
  const step = onboardingSteps[currentIdx];
  const isComplete = completed.has(step.id);
  const allDone = completed.size >= total;

  const completeStep = () => {
    const next = new Set([...completed, step.id]);
    setCompleted(next);
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleEnter = () => {
    localStorage.setItem('ss-onboarding-done', 'true');
    router.push('/portal/home');
  };

  const handleSkip = () => {
    localStorage.setItem('ss-onboarding-done', 'true');
    router.push('/portal/home');
  };

  const isLastStep = currentIdx === total - 1;
  const canEnter = allDone || (isLastStep && isComplete);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--sidebar-bg)' }}
      >
        <div className="flex items-center gap-2.5">
          <SsLogo size={48} />
          <span className="font-serif text-[17px]" style={{ color: 'var(--text)' }}>SS Sustain</span>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text3)' }}>
          {completed.size} of {total} steps complete
        </span>
      </div>

      <div className="max-w-[760px] mx-auto px-6 py-10">
        {/* Heading */}
        <div className="mb-2">
          <h1 className="font-serif text-[32px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
            Before you dive in, <em className="italic" style={{ color: 'var(--accent-text)' }}>complete these.</em>
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
            Work through each step in order. Your portal unlocks when all steps are done.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full my-6 overflow-hidden" style={{ background: 'var(--bg3)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completed.size / total) * 100}%`, background: 'var(--accent)' }}
          />
        </div>

        {/* Current step card */}
        <div
          className="rounded-[14px] overflow-hidden mb-6"
          style={{ border: '1px solid var(--border2)', boxShadow: 'var(--shadow)', background: 'var(--surface)' }}
        >
          {/* Step label */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--accent-text)' }}>
              Step {currentIdx + 1} of {total} — {step.type === 'video' ? 'Video' : step.type === 'doc' ? 'Document' : 'Action'}
            </span>
            {isComplete && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}
              >
                ✓ Complete
              </span>
            )}
          </div>

          {/* Video mock player */}
          {step.type === 'video' && (
            <div
              className="aspect-video flex flex-col items-center justify-center relative"
              style={{ background: 'var(--bg2)' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105"
                style={{ background: 'var(--accent)' }}
                onClick={() => !isComplete && completeStep()}
              >
                <div
                  className="ml-1"
                  style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '17px solid #fff' }}
                />
              </div>
              {step.duration && (
                <span
                  className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-[1px] px-2 py-1 rounded"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'var(--accent-text)' }}
                >
                  {step.duration}
                </span>
              )}
              {isComplete && (
                <span
                  className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  ✓ Watched
                </span>
              )}
            </div>
          )}

          {/* Doc / action area */}
          {step.type !== 'video' && (
            <div
              className="flex items-center justify-center py-12 px-8"
              style={{ background: 'var(--bg2)' }}
            >
              <div
                className="w-16 h-16 rounded-[14px] flex items-center justify-center text-3xl"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
              >
                {step.type === 'doc' ? '📄' : '✅'}
              </div>
            </div>
          )}

          {/* Info + button */}
          <div className="px-6 py-5">
            <h2 className="font-serif text-[21px] mb-1.5" style={{ color: 'var(--text)' }}>{step.title}</h2>
            <p className="text-[13px] leading-[1.75] mb-5" style={{ color: 'var(--text2)' }}>{step.description}</p>

            <div className="flex items-center gap-3 flex-wrap">
              {!isLastStep || !canEnter ? (
                <button
                  onClick={() => {
                    if (step.url && !isComplete) window.open(step.url, '_blank', 'noopener,noreferrer');
                    completeStep();
                  }}
                  disabled={isComplete}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-default"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                >
                  {isComplete
                    ? '✓ Done — move to next step ↓'
                    : step.type === 'video'
                    ? 'Mark as watched →'
                    : step.actionLabel + ' →'}
                </button>
              ) : null}

              {canEnter && (
                <button
                  onClick={handleEnter}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                >
                  Enter your portal →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step list */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: 'var(--text3)' }}>
            All steps
          </p>
          <div className="flex flex-col gap-1.5">
            {onboardingSteps.map((s, i) => {
              const done = completed.has(s.id);
              const active = i === currentIdx;
              const locked = i > currentIdx && !done;

              return (
                <button
                  key={s.id}
                  disabled={locked}
                  onClick={() => !locked && setCurrentIdx(i)}
                  className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-left transition-all duration-150 w-full disabled:cursor-not-allowed"
                  style={{
                    background: active ? 'var(--accent-dim)' : 'var(--surface)',
                    border: active ? '1px solid var(--accent-mid)' : '1px solid var(--border)',
                    opacity: locked ? 0.45 : 1,
                  }}
                >
                  {/* indicator */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={
                      done
                        ? { background: 'var(--accent)', color: '#fff' }
                        : active
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)' }
                    }
                  >
                    {done ? '✓' : locked ? '🔒' : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: active ? 'var(--accent-text)' : done ? 'var(--text2)' : 'var(--text)' }}
                    >
                      {s.title}
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.8px] flex-shrink-0"
                    style={{ color: 'var(--text3)' }}
                  >
                    {s.type === 'video' ? s.duration : s.type === 'doc' ? 'Doc' : 'Action'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin bypass */}
        <div className="mt-8 pt-5 flex justify-center" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSkip}
            className="text-[11px] transition-colors duration-150"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
          >
            Admin: skip onboarding and enter portal →
          </button>
        </div>
      </div>
    </div>
  );
}
