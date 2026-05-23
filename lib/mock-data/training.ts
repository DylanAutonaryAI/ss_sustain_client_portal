import type { VideoClip } from '@/lib/types';

export const trainingClips: VideoClip[] = [
  { id: '1', tag: 'Chest',    title: 'Incline DB Press — Full Form Guide',  meta: 'Upper chest · 8 min' },
  { id: '2', tag: 'Back',     title: 'Lat Pulldown — Scapular Control',     meta: 'Width & depth · 6 min' },
  { id: '3', tag: 'Legs',     title: 'Hack Squat — Setup & Execution',      meta: 'Quad dominant · 10 min' },
  { id: '4', tag: 'Shoulders',title: 'Lateral Raises — Avoiding Traps',     meta: 'Side delt · 5 min' },
  { id: '5', tag: 'Arms',     title: 'Cable Curl — Peak Contraction',       meta: 'Bicep focus · 4 min' },
  { id: '6', tag: 'Recovery', title: 'Post Session Stretching Routine',     meta: 'Full body · 12 min' },
];

export const posingVideos: VideoClip[] = [
  { id: '7', tag: 'Front', title: 'Front Double Bicep',  meta: 'Classic mandatory · 5 min' },
  { id: '8', tag: 'Side',  title: 'Side Chest Pose',     meta: 'Classic mandatory · 4 min' },
  { id: '9', tag: 'Back',  title: 'Rear Double Bicep',   meta: 'Classic mandatory · 5 min' },
];

export const posingTips = [
  { key: 'Vacuum',       body: 'Every morning on an empty stomach. 5 sets of 30-second holds before cardio.' },
  { key: 'Mandatories',  body: 'Run all 8 mandatory poses daily. Muscle memory takes 4–6 weeks to build.' },
  { key: 'Transitions',  body: 'The walk between poses matters as much as the pose. Keep it deliberate.' },
  { key: 'Mirror work',  body: 'Film yourself weekly from all angles. What feels right often doesn\'t look right.' },
];
