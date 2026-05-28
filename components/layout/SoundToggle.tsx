'use client';

import { useEffect, useState } from 'react';
import { isSoundEnabled, setSoundEnabled, initSoundPref } from '@/lib/sound';

// Sits next to the theme toggle in the (client) sidebar. Turns the UI click/tab
// sounds on or off; the login transition swoosh is always on regardless.
export default function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => { initSoundPref(); setOn(isSoundEnabled()); }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  };

  return (
    <div
      onClick={toggle}
      className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer"
      style={{ background: 'var(--bg3)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
        Sound effects
      </span>
      <div
        className="relative w-[34px] h-[18px] rounded-full transition-colors duration-200 cursor-pointer"
        style={{ background: on ? 'var(--accent)' : 'var(--border2)' }}
      >
        <div
          className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform duration-200"
          style={{
            transform: on ? 'translateX(16px)' : 'translateX(0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
}
