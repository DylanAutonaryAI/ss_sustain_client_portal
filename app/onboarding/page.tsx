'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ONBOARDING_STEPS } from '@/lib/onboarding';
import SsLogo from '@/components/ui/SsLogo';

export default function OnboardingPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const total = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentIdx];
  const isComplete = completed.has(step.id);
  const isOpened = opened.has(step.id) || !step.url; // nothing to open → ready to confirm
  const allDone = completedAt !== null;

  // Hydrate progress from the server so a returning / cross-device client picks
  // up exactly where they left off.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/me', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          const done: string[] = data.completed ?? [];
          setCompleted(new Set(done));
          setCompletedAt(data.completedAt ?? null);
          // Resume on the first unfinished step.
          const firstUnfinished = ONBOARDING_STEPS.findIndex((s) => !done.includes(s.id));
          setCurrentIdx(firstUnfinished === -1 ? total - 1 : firstUnfinished);
        }
      } catch {
        // Offline / server hiccup — they can still work through it, saves will retry.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [total]);

  const openStep = () => {
    if (step.url) window.open(step.url, '_blank', 'noopener,noreferrer');
    setOpened((prev) => new Set(prev).add(step.id));
  };

  const completeStep = useCallback(async () => {
    if (isComplete || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_key: step.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save your progress. Try again.');
        return;
      }
      setCompleted(new Set<string>(data.completed ?? []));
      setCompletedAt(data.completedAt ?? null);
      if (currentIdx < total - 1) setCurrentIdx(currentIdx + 1);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [isComplete, saving, step.id, currentIdx, total]);

  const handleEnter = () => { router.push('/portal/home'); };

  const isLastStep = currentIdx === total - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading your onboarding…</span>
      </div>
    );
  }

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

        {/* All-done banner */}
        {allDone && (
          <div
            className="rounded-[12px] px-5 py-4 mb-6 flex items-center justify-between gap-4"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
          >
            <div>
              <p className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--accent-text)' }}>
                🎉 Onboarding complete
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text2)' }}>
                Your portal is now fully unlocked. Welcome to SS Sustain.
              </p>
            </div>
            <button
              onClick={handleEnter}
              className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200 flex-shrink-0"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
            >
              Enter your portal →
            </button>
          </div>
        )}

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
                onClick={() => { if (!isComplete) openStep(); }}
              >
                <div
                  className="ml-1"
                  style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '17px solid #fff' }}
                />
              </div>
              {step.placeholder && (
                <span
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-1 rounded text-center"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'var(--text2)' }}
                >
                  Video coming soon — Sam is adding this
                </span>
              )}
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
              {isComplete ? (
                <span
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold inline-flex items-center gap-1.5"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}
                >
                  ✓ Done{!isLastStep && ' — next step below ↓'}
                </span>
              ) : !isOpened ? (
                // Step has a link/video the client must open first.
                <button
                  onClick={openStep}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                >
                  {step.type === 'video' ? 'Watch video ↗' : (step.actionLabel ?? 'Open') + ' ↗'}
                </button>
              ) : (
                // Opened (or nothing to open) — confirm to mark complete.
                <button
                  onClick={completeStep}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-default"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                >
                  {saving
                    ? 'Saving…'
                    : step.confirmLabel
                    ? step.confirmLabel
                    : step.type === 'video'
                    ? "✓ I've watched this"
                    : step.type === 'doc'
                    ? "✓ I've read this"
                    : step.actionLabel ?? 'Mark as done'}
                </button>
              )}

              {step.url && !isComplete && isOpened && (
                <button
                  onClick={openStep}
                  className="text-[12px] transition-colors duration-150"
                  style={{ color: 'var(--text3)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
                >
                  Open again ↗
                </button>
              )}
            </div>

            {error && (
              <p className="text-[12px] mt-3" style={{ color: 'var(--red)' }}>{error}</p>
            )}
          </div>
        </div>

        {/* Step list */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: 'var(--text3)' }}>
            All steps
          </p>
          <div className="flex flex-col gap-1.5">
            {ONBOARDING_STEPS.map((s, i) => {
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
      </div>
    </div>
  );
}
