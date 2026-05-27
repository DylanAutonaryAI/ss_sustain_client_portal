'use client';

// A template re-mounts on every navigation (unlike a layout), so this gives each
// portal page a quick fade as you move between sections. The sidebar lives in the
// layout, so it stays put — only the content area animates.
//
// NB: fade-ONLY (no transform). A transform here would become the containing block
// for any `position: fixed` descendant (modals), breaking their full-screen overlay.
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
