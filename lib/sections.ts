// Canonical portal sections surfaced in the coach Analytics "most visited" chart,
// with the labels the coach sees. Keys match the rpc-recorded section (the
// /portal/<key> path segment, lower-cased). Home/settings/onboarding are tracked
// too but kept out of this list — home is trivially ~100% and the rest aren't
// content. Plain module (no 'use client') so both the client hook and the
// server-side analytics route can import it.
export const TRACKED_SECTIONS: { key: string; label: string }[] = [
  { key: 'training',        label: 'Training Clips' },
  { key: 'posing',          label: 'Posing Area' },
  { key: 'library',         label: 'Resource Library' },
  { key: 'webinars',        label: 'Webinars' },
  { key: 'supplements',     label: 'Supplements' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'mindset',         label: 'Mindset' },
  { key: 'community',       label: 'Community' },
];
