import type { VideoClip } from '@/lib/types';

// Training clips are a blank slate — clients submit their form-check videos to coach
export const trainingClips: VideoClip[] = [];

export const posingVideos: VideoClip[] = [
  {
    id: 'p1',
    tag: 'Posing',
    title: 'Posing Practice — Clip 1',
    meta: 'YouTube Shorts',
    url: 'https://www.youtube.com/shorts/NrBibnwAbrI',
  },
  {
    id: 'p2',
    tag: 'Posing',
    title: 'Posing Practice — Clip 2',
    meta: 'YouTube Shorts',
    url: 'https://www.youtube.com/shorts/kJMK1vV7wRI',
  },
  {
    id: 'p3',
    tag: 'Posing',
    title: 'Posing Practice — Clip 3',
    meta: 'YouTube Shorts',
    url: 'https://www.youtube.com/shorts/33GezNhiD8I',
  },
];

export const posingTips = [
  { key: 'Vacuum',      body: 'Every morning on an empty stomach. 5 sets of 30-second holds before cardio.' },
  { key: 'Mandatories', body: 'Run all 8 mandatory poses daily. Muscle memory takes 4–6 weeks to build.' },
  { key: 'Transitions', body: 'The walk between poses matters as much as the pose. Keep it deliberate.' },
  { key: 'Mirror work', body: "Film yourself weekly from all angles. What feels right often doesn't look right." },
];
