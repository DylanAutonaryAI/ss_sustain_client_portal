// Tiny synthesized UI sounds via the Web Audio API — no audio files, fully tunable.
// Two sounds:
//   • playClick()  — soft, pleasant tick for button / tab clicks. Respects the
//                    user's on/off toggle (persisted in localStorage).
//   • playSwoosh() — sheen / sword-swing for the login transition. ALWAYS plays
//                    (ignores the toggle), per design.
// Browser autoplay rules are never an issue: both are only ever fired from a click.

let ctx: AudioContext | null = null;
let enabled = true; // UI click sounds on/off (swoosh ignores this)

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Create/resume the context inside a user gesture so the (post-await) login
// swoosh is guaranteed to be allowed to play, even on stricter browsers.
export function primeAudio() { getCtx(); }

export function initSoundPref() {
  if (typeof window === 'undefined') return;
  enabled = localStorage.getItem('ss-sound') !== 'off'; // default ON
}

export function isSoundEnabled() { return enabled; }

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (typeof window !== 'undefined') localStorage.setItem('ss-sound', on ? 'on' : 'off');
  if (on) playNav(); // immediate feedback when switching on (toggle lives in the sidebar)
}

// Soft, pleasant click — two consonant sine partials with a quick decay. Low
// volume so frequent clicks never grate. Two voices:
//   • playNav()    — sidebar nav / tab clicks (lower, softer)
//   • playAction() — anything clicked inside the page content (brighter, higher)
function tick(f1: number, f2: number) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.06, now + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  out.connect(ac.destination);

  [f1, f2].forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const g = ac.createGain();
    g.gain.value = i === 0 ? 1 : 0.35;
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.14);
  });
}

export function playNav()    { tick(660, 990); }   // left sidebar — lower
export function playAction() { tick(1040, 1560); } // inside a tab — higher / brighter

// Sheen / sword-swing — a band-passed noise burst whose centre frequency sweeps
// up then down, giving the "whoosh". Used for the login transition only.
export function playSwoosh() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 0.5;

  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(500, now);
  bp.frequency.exponentialRampToValueAtTime(3600, now + 0.18);
  bp.frequency.exponentialRampToValueAtTime(700, now + dur);

  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.13, now + 0.08);
  out.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  noise.connect(bp);
  bp.connect(out);
  out.connect(ac.destination);
  noise.start(now);
  noise.stop(now + dur);
}
