'use client';

// Re-mounts on each navigation, giving every coach page a quick fade as you move
// between sections. The sidebar (in the layout) stays put.
//
// NB: fade-ONLY (no transform). A transform here would become the containing block
// for any `position: fixed` descendant (modals), breaking their full-screen overlay.
export default function CoachTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
