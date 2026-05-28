'use client';

import { useEffect } from 'react';
import { playSwoosh } from '@/lib/sound';

// Full-screen white splash shown the moment login succeeds: Sam's logo swooshes
// into the centre with a green streak whooshing across (Twitch scene-transition
// feel) and a sheen/sword-swing sound, then the page hard-navigates to the
// dashboard underneath it. Reduced motion just shows the logo (the global media
// query zeroes the animations). The swoosh sound is always on.
export default function LoginSplash() {
  useEffect(() => { playSwoosh(); }, []);
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* green streak sweeping across behind the logo */}
      <div
        className="absolute top-0 h-full w-[120px] animate-splash-streak"
        style={{
          left: 0,
          background: 'linear-gradient(90deg, transparent, rgba(32,182,35,0.55), transparent)',
          filter: 'blur(10px)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/applogo.png"
        alt="SS Sustain"
        width={150}
        height={150}
        className="animate-splash-logo"
        style={{ display: 'block', objectFit: 'contain' }}
      />
      <span className="animate-splash-word font-serif text-[22px] mt-4" style={{ color: '#111111' }}>
        SS Sustain
      </span>
    </div>
  );
}
